"""매일 자정(KST)에 계정마다 그날의 point_logs 기본 행(point=0)을 만들어두는 스케줄러.

todos 알림 스케줄러(app/scheduler.py)와는 완전히 별개 — 이건 "포인트가 그날 그날
0부터 시작한다"는 걸 실제 행으로도 보장해주는 용도다. GET /users/me/points는 이 행이
없어도 계산상 0으로 채워서 보여주지만, 매일 실제로 행이 생기길 원해서 추가함.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session, select

from app.database import engine
from app.models import PointLog, User
from app.timeutil import now_kst

point_scheduler = BackgroundScheduler()


def seed_today_point_logs() -> None:
    """오늘 날짜의 "기본 행"(todo_id=None, point=0)이 없는 유저에게만 새로 만들어준다.
    이미 있으면 건너뛴다 (서버 재시작 등으로 여러 번 호출돼도 중복 생성 안 되게)."""
    today = now_kst().date()

    with Session(engine) as session:
        users = session.exec(select(User)).all()
        for user in users:
            exists = session.exec(
                select(PointLog).where(
                    PointLog.user_id == user.id,
                    PointLog.pointdate == today,
                    PointLog.todo_id == None,  # noqa: E711 (자정 기본 행 구분: todo_id 없음)
                )
            ).first()
            if not exists:
                session.add(PointLog(user_id=user.id, todo_id=None, point=0, pointdate=today))
        session.commit()


def start_point_scheduler() -> None:
    # 서버가 자정을 넘겨서 껐다 켜지는 경우를 대비해, 시작할 때 한 번 먼저 실행해둔다.
    seed_today_point_logs()
    point_scheduler.add_job(
        seed_today_point_logs,
        "cron",
        hour=0,
        minute=0,
        timezone="Asia/Seoul",
        id="seed_daily_point_logs",
    )
    point_scheduler.start()
