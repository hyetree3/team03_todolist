"""개발용 가라 데이터 삽입 스크립트.

실행: .venv/Scripts/python.exe seed.py
이미 있는 username은 건너뛰고, 없는 것만 새로 만든다 (여러 번 실행해도 안전).
"""
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.database import engine, init_db
from app.models import Todo, User
from app.security import hash_password

# (username, password, [ (title, 마감까지 남은 시간(분) 또는 None, is_done) ])
SEED_USERS = [
    (
        "alice",
        "password123",
        [
            ("장보기", 30, False),          # 30분 뒤 마감 -> 알림 대상(1시간 이내)
            ("보고서 제출", 60 * 5, False),   # 5시간 뒤 마감 -> 아직 알림 대상 아님
            ("책 읽기", None, False),         # 마감 없음
            ("운동하기", -60, True),          # 이미 지난 마감, 완료 처리됨
        ],
    ),
    (
        "bob",
        "password123",
        [
            ("회의 준비", 45, False),        # 45분 뒤 마감 -> 알림 대상
            ("청소하기", 60 * 24, False),     # 내일
        ],
    ),
]


def seed() -> None:
    init_db()
    now = datetime.utcnow()

    with Session(engine) as session:
        for username, password, todos in SEED_USERS:
            user = session.exec(select(User).where(User.username == username)).first()
            if user is None:
                user = User(username=username, password_hash=hash_password(password))
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"[생성] 유저 {username}")
            else:
                print(f"[skip] 유저 {username} 이미 존재")

            for title, minutes_from_now, is_done in todos:
                exists = session.exec(
                    select(Todo).where(Todo.user_id == user.id, Todo.title == title)
                ).first()
                if exists:
                    continue
                due_at = now + timedelta(minutes=minutes_from_now) if minutes_from_now is not None else None
                todo = Todo(user_id=user.id, title=title, due_at=due_at, is_done=is_done)
                session.add(todo)
                print(f"  [생성] 할일 '{title}' (마감: {due_at}, 완료: {is_done})")

            session.commit()

    print("\n시딩 완료. 로그인용 계정 (전부 비밀번호: password123):")
    for username, _, _ in SEED_USERS:
        print(f"  - {username}")


if __name__ == "__main__":
    seed()
