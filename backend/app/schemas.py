"""요청/응답 Pydantic v2 스키마. 내부 전용 필드(password_hash, user_id, notified)는
여기서 아예 제외해서 API 응답에 노출되지 않도록 한다."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, model_validator


# ---------- 인증 ----------
class UserCreate(BaseModel):
    username: str
    password: str
    # 구글 캘린더/디스코드 개인 알림 연동용 — 다른 담당 기능이 쓸 값이라 여기선 저장만 한다.
    email: Optional[str] = None
    discord_id: Optional[str] = None
    # 알림 말투 스타일. kakao 알림 모듈이 참조해서 메시지 톤을 바꾼다.
    alarm_style: Literal["love", "normal", "nagging"] = "normal"

    @model_validator(mode="after")
    def require_notification_channel(self):
        # kakao 모듈이 개인 알림(디스코드 DM/구글 캘린더)을 담당하므로, 최소 하나는
        # 연결할 방법이 있어야 회원가입 후 알림을 받을 수 있다.
        if not self.email and not self.discord_id:
            raise ValueError("email 또는 discord_id 중 최소 하나는 입력해야 합니다.")
        return self


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    discord_id: Optional[str] = None
    point: int
    alarm_style: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


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


class TodoStats(BaseModel):
    total: int
    completed: int
    completion_rate: float


class TodoRead(BaseModel):
    id: int
    title: str
    memo: Optional[str] = None
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: bool
    created_at: datetime

    model_config = {"from_attributes": True}
