"""할일 알림/캘린더 처리를 "즉시" 트리거하고, 놓친 게 있을 때만 대비하는 안전망.

할일이 오직 이 backend API를 통해서만 생성/수정/삭제된다는 전제 하에, kakao처럼 별도
프로세스가 DB를 몇 분마다 폴링해서 뒤늦게 알아채는 방식 대신, 여기서 생성/수정/삭제
"그 순간" 바로 처리한다:
- 할일 생성 -> handle_todo_created() (app/routers/todos.py의 BackgroundTasks로 호출)
- 할일의 마감시각 수정 -> schedule_due_soon() 재예약
- 할일 삭제 -> cleanup_calendar_event() 로 캘린더 이벤트 즉시 정리

그래도 서버가 재시작되는 타이밍 등으로 놓치는 경우를 대비해, point_scheduler.py와 같은
패턴(APScheduler BackgroundScheduler)으로 5분마다 도는 안전망 스윕을 같이 둔다 — 정상
상황에서는 위 즉시 처리 경로가 전부 끝내므로 이 스윕이 할 일은 거의 없어야 한다.
"""
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session, select

from app.crypto_utils import decrypt
from app.database import engine
from app.google_calendar import delete_event
from app.models import CalendarEventLog, Todo, User
from app.notifier import send_created_notification, send_due_soon_notification
from app.timeutil import now_kst

_scheduler = BackgroundScheduler()


def handle_todo_created(todo_id: int) -> None:
    """할일이 막 생성된 직후 바로 호출된다. 생성 알림(Discord DM + 캘린더 등록)을 시도하고,
    마감이 있으면 정확히 "마감 1시간 전" 시각에 한 번 실행되는 예약을 건다."""
    due_at = None
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if not todo:
            return
        user = session.get(User, todo.user_id)
        if not user:
            return
        due_at = todo.due_at
        if send_created_notification(user, todo):
            todo.created_notified = True
            session.add(todo)
            session.commit()

    if due_at:
        schedule_due_soon(todo_id, due_at)


def _fire_due_soon(todo_id: int) -> None:
    """schedule_due_soon()이 예약해둔 정확한 시각에 실행되는 1회성 잡. 그 사이 완료
    처리됐거나 이미 알림이 나갔으면 아무것도 하지 않는다."""
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if not todo or todo.is_done or todo.notified:
            return
        user = session.get(User, todo.user_id)
        if not user:
            return
        if send_due_soon_notification(user, todo):
            todo.notified = True
            session.add(todo)
            session.commit()


def schedule_due_soon(todo_id: int, due_at) -> None:
    """이 할일의 "마감 1시간 전" 알림이 정확히 그 시각에 한 번 실행되도록 예약한다. 이미
    그 시각이 지났으면(마감이 1시간 이내로 임박한 채로 생성/수정된 경우) 지금 바로 실행한다.

    같은 todo_id로 다시 호출하면(예: 마감 시각 수정) replace_existing으로 기존 예약을
    덮어쓴다 — update_todo에서 due_at이 바뀔 때마다 다시 불러도 안전하다."""
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


def cleanup_calendar_event(todo_id: int, user_id: int) -> None:
    """할일이 삭제된 직후 바로 호출된다. 그 할일 때문에 만들어졌던 캘린더 이벤트를
    실제 구글 캘린더에서 지우고 CalendarEventLog 기록도 지운다."""
    with Session(engine) as session:
        logs = session.exec(
            select(CalendarEventLog).where(CalendarEventLog.todo_id == todo_id)
        ).all()
        if not logs:
            return

        user = session.get(User, user_id)
        if user and user.google_refresh_token_encrypted:
            refresh_token = decrypt(user.google_refresh_token_encrypted)
            for log in logs:
                try:
                    delete_event(refresh_token, log.event_id)
                except Exception as exc:  # noqa: BLE001 - 외부 API 실패해도 로그 정리는 계속 진행
                    print(f"[notification_scheduler] 캘린더 이벤트 삭제 실패 (event_id={log.event_id}): {exc}")

        for log in logs:
            session.delete(log)
        session.commit()


def _safety_net_sweep() -> None:
    """즉시 처리 경로가 어떤 이유로든(서버 재시작 타이밍 등) 놓친 게 있는지 5분마다
    훑어보는 보조 안전망. 정상 상황에서는 거의 할 일이 없어야 한다."""
    now = now_kst()
    window_end = now + timedelta(hours=1)

    with Session(engine) as session:
        created_statement = select(Todo).where(Todo.created_notified == False)  # noqa: E712
        for todo in session.exec(created_statement).all():
            user = session.get(User, todo.user_id)
            if not user:
                continue
            if send_created_notification(user, todo):
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
            if send_due_soon_notification(user, todo):
                todo.notified = True
                session.add(todo)
                session.commit()


def _schedule_all_pending_due_soon() -> None:
    """서버가 시작될 때 한 번, 아직 마감 임박 알림을 못 보낸 할일 전부에 대해 정확한
    1회성 예약을 걸어준다 (서버가 꺼져있던 동안 생성됐거나 마감이 수정된 할일 포함)."""
    with Session(engine) as session:
        statement = select(Todo).where(
            Todo.is_done == False,  # noqa: E712
            Todo.notified == False,  # noqa: E712
            Todo.due_at.is_not(None),
        )
        for todo in session.exec(statement).all():
            schedule_due_soon(todo.id, todo.due_at)


def start_notification_scheduler() -> None:
    _scheduler.add_job(_safety_net_sweep, "interval", minutes=5, id="notification_safety_net_sweep")
    _scheduler.start()
    _schedule_all_pending_due_soon()
    # 서버가 막 시작된 직후엔 최대 5분까지 안전망이 늦게 돌 수 있으니, 시작하자마자 한 번
    # 즉시 실행되도록 예약해서 재시작 타이밍으로 놓친 게 있으면 바로 잡는다.
    _scheduler.add_job(_safety_net_sweep, "date", run_date=now_kst(), id="startup_immediate_check")
