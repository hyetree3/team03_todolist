"""개발용 가라 데이터 삽입 스크립트.

실행: .venv/Scripts/python.exe seed.py
이미 있는 username은 건너뛰고, 없는 것만 새로 만든다 (여러 번 실행해도 안전).
DB 스키마가 바뀌어서 app.db를 지우고 다시 만들었을 때, 이 스크립트 한 번으로
발표/데모용 데이터를 원래대로 복구하는 용도.
"""
from datetime import timedelta

from sqlmodel import Session, select

from app.database import engine, init_db
from app.models import PointLog, Todo, User
from app.security import hash_password
from app.timeutil import now_kst

# (username, password, discord_id, alarm_style, [ (title, memo, category, 마감까지 남은 시간(분) 또는 None, is_done) ])
SEED_USERS = [
    (
        "혜림", "password123", "hyerim#0001", "love",
        [
            ("프로젝트 준비", None, None, 60 * 24, True),
            ("팩스보내기", None, None, -1, False),
            ("운동하기", "헬스장 30분", "개인", 60 * 10, False),
            ("책 읽기", None, "개인", 60 * 24, False),
        ],
    ),
    (
        "재원", "password123", "jaewon#0001", "normal",
        [
            ("api 연동하기", None, None, 60 * 5, False),
            ("디스코드 봇 테스트", "user-install 방식 DM 되는지 확인", "업무", 60 * 24, False),
        ],
    ),
    (
        "민서", "password123", "minseo#0001", "normal",
        [
            ("frontend 완성하기", None, None, 60 * 5, False),
            ("장보기", "우유, 계란, 과일", "개인", 60 * 24, False),
            ("강아지 산책", None, "개인", 60 * 8, False),
        ],
    ),
    (
        "교수", "password123", "professor#0001", "normal",
        [
            ("진행내용확인하기", None, None, -1, False),
            ("회의 자료 검토", None, "업무", 60 * 6, False),
        ],
    ),
]

# 혜림 계정에 넣어둘 지난 며칠치 포인트 기록 (성장 그래프 데모용). 오늘 기준 며칠 전인지 -> 포인트.
POINT_HISTORY_BACKFILL = {
    "혜림": {-6: 10, -5: 20, -4: 0, -3: 30, -2: 10, -1: 20},
}


def seed() -> None:
    init_db()
    now = now_kst()
    today = now.date()

    with Session(engine) as session:
        for username, password, discord_id, alarm_style, todos in SEED_USERS:
            user = session.exec(select(User).where(User.username == username)).first()
            if user is None:
                user = User(
                    username=username,
                    password_hash=hash_password(password),
                    discord_id=discord_id,
                    alarm_style=alarm_style,
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                # 가입 순간부터 오늘의 포인트 0 기본 행 (실제 회원가입 로직과 동일하게 맞춤).
                session.add(PointLog(user_id=user.id, todo_id=None, point=0, pointdate=today))
                session.commit()
                print(f"[생성] 유저 {username}")
            else:
                print(f"[skip] 유저 {username} 이미 존재")

            for title, memo, category, minutes_from_now, is_done in todos:
                exists = session.exec(
                    select(Todo).where(Todo.user_id == user.id, Todo.title == title)
                ).first()
                if exists:
                    continue
                due_at = now + timedelta(minutes=minutes_from_now) if minutes_from_now is not None else None
                todo = Todo(
                    user_id=user.id, title=title, memo=memo, category=category,
                    due_at=due_at, is_done=is_done,
                )
                session.add(todo)
                session.commit()
                session.refresh(todo)
                if is_done:
                    session.add(PointLog(user_id=user.id, todo_id=todo.id, point=10, pointdate=today))
                print(f"  [생성] 할일 '{title}'")

            session.commit()

        for username, history in POINT_HISTORY_BACKFILL.items():
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                continue
            for offset, points in history.items():
                d = today + timedelta(days=offset)
                exists = session.exec(
                    select(PointLog).where(PointLog.user_id == user.id, PointLog.pointdate == d)
                ).first()
                if exists:
                    continue
                session.add(PointLog(user_id=user.id, todo_id=None, point=points, pointdate=d))
            session.commit()
            print(f"[생성] {username} 포인트 히스토리 백필")

    print("\n시딩 완료. 로그인용 계정 (전부 비밀번호: password123):")
    for username, *_ in SEED_USERS:
        print(f"  - {username}")


if __name__ == "__main__":
    seed()
