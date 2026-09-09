from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import select

from crypto_utils import decrypt
from db import get_session
from google_calendar import delete_event
from models import CalendarEventLog, Todo, User
from notifier import send_created_notification, send_due_soon_notification
from timeutil import now_kst

# 마감 1시간 전 정밀 예약(schedule_due_soon)이 잡을 걸 이 스케줄러 인스턴스에 등록해야
# 해서 모듈 레벨에 보관해둔다. start_scheduler() 호출 전에는 None.
_scheduler: AsyncIOScheduler | None = None


async def check_and_notify() -> None:
    """주기적으로 도는 안전망(fallback) 스캔. 원래는 이 폴링만으로 "마감 1시간 전"을
    잡았는데, 폴링 주기(기본 5분) 때문에 정확히 1시간 전이 아니라 최대 폴링 주기만큼
    늦게 발송될 수 있었다. 지금은 schedule_due_soon()이 정확한 시각에 1회성으로 실행되는
    게 기본 경로이고, 이 함수는 (봇이 꺼져있던 사이 생성된 할일, 1회성 예약이 어떤
    이유로든 안 걸린 할일 등을 위한) 보조 안전망 역할이다.

    1. 생성 확인 알림: created_notified=False인 할일 전부 (마감 유무 상관없음). 마감이
       있으면 정확한 1시간 전 알림도 같이 예약한다(schedule_due_soon).
    2. 마감 임박 알림: is_done=False AND notified=False AND due_at가 (지금~지금+1시간)
       범위 안. 발송 성공한 항목만 각 플래그를 갱신 (CLAUD.md 명시된 처리 순서).

    due_at은 backend가 KST naive datetime으로 저장하므로(now_kst() 참고), 여기서도
    반드시 now_kst()로 비교해야 한다. UTC로 비교하면 9시간이 어긋나 엉뚱한 시각에
    알림이 발송된다."""
    now = now_kst()
    window_end = now + timedelta(hours=1)

    with get_session() as session:
        created_statement = select(Todo).where(Todo.created_notified == False)  # noqa: E712
        for todo in session.exec(created_statement).all():
            user = session.get(User, todo.user_id)
            if not user:
                continue

            if await send_created_notification(user, todo):
                todo.created_notified = True
                session.add(todo)
                session.commit()
                if todo.due_at:
                    schedule_due_soon(todo.id, todo.due_at)

        due_soon_statement = select(Todo).where(
            Todo.is_done == False,  # noqa: E712
            Todo.notified == False,  # noqa: E712
            Todo.due_at.is_not(None),
            Todo.due_at >= now,
            Todo.due_at <= window_end,
        )
        for todo in session.exec(due_soon_statement).all():
            user = session.get(User, todo.user_id)
            if not user:
                continue

            if await send_due_soon_notification(user, todo):
                todo.notified = True
                session.add(todo)
                session.commit()


async def _fire_due_soon(todo_id: int) -> None:
    """schedule_due_soon()이 예약해둔 정확한 시각(마감 1시간 전)에 실행되는 1회성 잡.
    그 사이 완료 처리됐거나 이미 알림이 나갔으면 아무것도 하지 않는다."""
    with get_session() as session:
        todo = session.get(Todo, todo_id)
        if not todo or todo.is_done or todo.notified:
            return
        user = session.get(User, todo.user_id)
        if not user:
            return

        if await send_due_soon_notification(user, todo):
            todo.notified = True
            session.add(todo)
            session.commit()


def schedule_due_soon(todo_id: int, due_at: datetime) -> None:
    """이 할일의 "마감 1시간 전" 알림이 정확히 그 시각에 한 번 실행되도록 예약한다.
    이미 그 시각이 지났으면(예: 마감이 1시간 이내로 임박한 채로 생성된 경우) 지금 바로
    실행되도록 예약한다.

    주의: 이 예약은 메모리에만 있어서 봇 프로세스가 재시작되면 사라진다 — 그런 경우를
    대비해 check_and_notify()의 5분 폴링이 안전망으로 계속 돈다."""
    if _scheduler is None:
        return

    run_at = due_at - timedelta(hours=1)
    now = now_kst()
    if run_at < now:
        run_at = now

    _scheduler.add_job(
        _fire_due_soon,
        "date",
        run_date=run_at,
        args=[todo_id],
        id=f"due_soon_{todo_id}",
        replace_existing=True,
    )


def _schedule_all_pending_due_soon() -> None:
    """봇이 시작될 때 한 번, 아직 마감 임박 알림을 못 보낸 할일 전부에 대해 정확한
    1회성 예약을 걸어준다 (봇이 꺼져있던 동안 생성됐거나 마감이 수정된 할일 포함)."""
    with get_session() as session:
        statement = select(Todo).where(
            Todo.is_done == False,  # noqa: E712
            Todo.notified == False,  # noqa: E712
            Todo.due_at.is_not(None),
        )
        for todo in session.exec(statement).all():
            schedule_due_soon(todo.id, todo.due_at)


async def cleanup_deleted_todo_events() -> None:
    """할일이 삭제되면 그 행 자체가 사라져서, kakao가 "이 할일 삭제됐으니 캘린더
    이벤트도 지워야 한다"는 걸 실시간으로 알 방법이 없다. 대신 notifier가 이벤트를 만들
    때마다 남겨둔 CalendarEventLog(models.py 참고)를 주기적으로 훑어서, todo_id가 더 이상
    todos 테이블에 없는 행을 찾아 캘린더 이벤트를 지우고 로그도 같이 지운다."""
    with get_session() as session:
        for log in session.exec(select(CalendarEventLog)).all():
            if session.get(Todo, log.todo_id) is not None:
                continue  # 할일이 아직 살아있으면 건드리지 않는다

            user = session.get(User, log.user_id)
            if user and user.google_refresh_token_encrypted:
                try:
                    refresh_token = decrypt(user.google_refresh_token_encrypted)
                    delete_event(refresh_token, log.event_id)
                except Exception as exc:  # noqa: BLE001 - 외부 API 실패는 폭넓게 잡음
                    print(f"[scheduler] 삭제된 할일의 캘린더 이벤트 정리 실패 "
                          f"(event_id={log.event_id}): {exc}")
                    continue  # 지우기 실패하면 로그를 남겨서 다음 주기에 재시도

            session.delete(log)
            session.commit()


def start_scheduler(interval_minutes: int) -> AsyncIOScheduler:
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(check_and_notify, "interval", minutes=interval_minutes, id="periodic_sweep")
    _scheduler.add_job(
        cleanup_deleted_todo_events,
        "interval",
        minutes=interval_minutes,
        id="cleanup_deleted_todo_events",
    )
    _scheduler.start()
    _schedule_all_pending_due_soon()
    # 마감 임박 알림은 위에서 이미 재시작 시점에 즉시 재예약되는데, "생성 알림"(+캘린더 등록)은
    # 원래 5분 주기 스캔에서만 처리돼서, 봇이 막 재시작된 직후엔 최대 5분까지 지연될 수 있었다.
    # 캘린더 등록은 생성 시점에 최대한 빨리 이뤄져야 의미가 있으므로, 시작하자마자 한 번
    # 즉시 실행되도록 예약해서 이 지연을 없앤다.
    _scheduler.add_job(check_and_notify, "date", run_date=now_kst(), id="startup_immediate_check")
    _scheduler.add_job(
        cleanup_deleted_todo_events, "date", run_date=now_kst(), id="startup_immediate_cleanup"
    )
    return _scheduler
