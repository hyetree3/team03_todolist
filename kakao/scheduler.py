from datetime import timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import select

from db import get_session
from models import Todo, User
from notifier import send_notification
from timeutil import now_kst


async def check_and_notify() -> None:
    """알람대상: is_done=False AND notified=False AND due_at가 (지금~지금+1시간) 범위 안.
    발송 성공한 항목만 notified=True로 갱신 (CLAUD.md 명시된 처리 순서).

    due_at은 backend가 KST naive datetime으로 저장하므로(now_kst() 참고), 여기서도
    반드시 now_kst()로 비교해야 한다. UTC로 비교하면 9시간이 어긋나 엉뚱한 시각에
    알림이 발송된다."""
    now = now_kst()
    window_end = now + timedelta(hours=1)

    with get_session() as session:
        statement = select(Todo).where(
            Todo.is_done == False,  # noqa: E712
            Todo.notified == False,  # noqa: E712
            Todo.due_at.is_not(None),
            Todo.due_at >= now,
            Todo.due_at <= window_end,
        )
        due_todos = session.exec(statement).all()

        for todo in due_todos:
            user = session.get(User, todo.user_id)
            if not user:
                continue

            success = await send_notification(user, todo)
            if success:
                todo.notified = True
                session.add(todo)
                session.commit()


def start_scheduler(interval_minutes: int) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(check_and_notify, "interval", minutes=interval_minutes)
    scheduler.start()
    return scheduler
