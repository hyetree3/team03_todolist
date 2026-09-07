"""마감 임박 할일을 5분마다 확인해서 알림을 보내는 스케줄러.

채널이 무엇이든 이 로직은 그대로 둔다 (send_notification만 호출).
"""
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session, select

from app.database import engine
from app.models import Todo, User
from app.notifications import send_notification

scheduler = BackgroundScheduler()


def check_and_notify() -> None:
    now = datetime.utcnow()
    soon = now + timedelta(hours=1)

    with Session(engine) as session:
        # 미완료 + 아직 알림 안 보냄 + 마감이 지금~1시간 이내인 할일만 대상.
        targets = session.exec(
            select(Todo).where(
                Todo.is_done == False,  # noqa: E712 (SQLModel 비교라 == 필요)
                Todo.notified == False,  # noqa: E712
                Todo.due_at != None,  # noqa: E711
                Todo.due_at >= now,
                Todo.due_at <= soon,
            )
        ).all()

        for todo in targets:
            user = session.get(User, todo.user_id)
            username = user.username if user else "알수없음"
            text = f"[마감 임박] {username}님의 할일 '{todo.title}'이(가) 곧 마감입니다. (마감: {todo.due_at})"

            # 발송에 성공했을 때만 notified를 갱신한다 — 안 그러면 실패한 알림이
            # 영원히 재시도되지 않거나, 반대로 계속 중복 발송될 수 있다.
            if send_notification(text):
                todo.notified = True
                session.add(todo)

        session.commit()


def start_scheduler() -> None:
    scheduler.add_job(check_and_notify, "interval", minutes=5, id="due_soon_notifier")
    scheduler.start()
