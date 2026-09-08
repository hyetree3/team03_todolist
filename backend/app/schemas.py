"""요청/응답 Pydantic v2 스키마. 내부 전용 필드(password_hash, user_id, notified)는
여기서 아예 제외해서 API 응답에 노출되지 않도록 한다."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


# ---------- 인증 ----------
class UserCreate(BaseModel):
    # 회원가입은 아이디/비번만 받는다. email/discord_id는 나중에 설정 화면에서
    # UserSettingsUpdate로 따로 등록한다.
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserSettingsUpdate(BaseModel):
    """가입 후 설정 화면에서 알림 연동 정보를 채우거나 바꿀 때 쓰는 스키마.
    보낸 필드만 수정됨 (부분 수정)."""
    email: Optional[str] = None
    discord_id: Optional[str] = None
    alarm_style: Optional[Literal["love", "normal", "nagging"]] = None


class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    discord_id: Optional[str] = None
    alarm_style: str
    calender_alarm: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- 포인트 기록 ----------
class PointDayEntry(BaseModel):
    date: str  # "YYYY-MM-DD"
    points: int


class PointHistory(BaseModel):
    period: Literal["today", "week", "month", "year"]
    total: int  # 이 기간 동안 쌓인 포인트 합계
    days: list[PointDayEntry]


# ---------- 할일 ----------
class TodoCreate(BaseModel):
    title: str
    memo: Optional[str] = None
    category: Optional[str] = None
    due_at: Optional[datetime] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    memo: Optional[str] = None
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: Optional[bool] = None


class TodoRead(BaseModel):
    id: int
    title: str
    memo: Optional[str] = None
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: bool
    created_at: datetime

    model_config = {"from_attributes": True}
