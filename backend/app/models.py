"""DB 테이블 정의 (SQLModel). users / todos."""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    # 평문 비밀번호는 절대 저장하지 않는다 — 해시만 저장.
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: Optional[int] = Field(default=None, primary_key=True)
    # 이 할일의 주인. 내부 전용 — API 응답에는 노출하지 않는다.
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    due_at: Optional[datetime] = None
    is_done: bool = False
    # 마감 임박 알림을 이미 보냈는지 여부 — 중복 발송 방지용 내부 플래그.
    notified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
