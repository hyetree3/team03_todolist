"""요청/응답 Pydantic v2 스키마. 내부 전용 필드(password_hash, user_id, notified)는
여기서 아예 제외해서 API 응답에 노출되지 않도록 한다."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ---------- 인증 ----------
class UserCreate(BaseModel):
    username: str
    password: str
    # 구글 캘린더/디스코드 개인 알림 연동용 — 다른 담당 기능이 쓸 값이라 여기선 저장만 한다.
    email: Optional[str] = None
    discord_id: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    discord_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- 할일 ----------
class TodoCreate(BaseModel):
    title: str
    due_at: Optional[datetime] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: Optional[bool] = None


class TodoRead(BaseModel):
    id: int
    title: str
    due_at: Optional[datetime] = None
    is_done: bool
    created_at: datetime

    model_config = {"from_attributes": True}
