"""DB 테이블 정의 (SQLModel). users / todos."""
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel

from app.timeutil import now_kst


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    # 평문 비밀번호는 절대 저장하지 않는다 — 해시만 저장.
    password_hash: str
    # 구글 캘린더 연동/디스코드 개인 알림은 다른 담당이 만들 기능 — 여기서는 값만 받아서 저장.
    email: Optional[str] = None
    discord_id: Optional[str] = None
    # 구글 캘린더 OAuth refresh token (암호화된 값 저장) — 다른 담당 기능이 채워넣을 값,
    # 내부 전용(API 응답에 노출 금지).
    google_refresh_token_encrypted: Optional[str] = None
    # 할일을 완료할 때마다 쌓이는 포인트. 나중에 포인트로 캐릭터/나무를 키우는 기능에 쓸 예정.
    point: int = Field(default=0)
    # 알림 말투 스타일. kakao 알림 모듈이 이 값을 보고 메시지 톤을 바꾼다 (love/normal/nagging).
    alarm_style: str = Field(default="normal")
    created_at: datetime = Field(default_factory=now_kst)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: Optional[int] = Field(default=None, primary_key=True)
    # 이 할일의 주인. 내부 전용 — API 응답에는 노출하지 않는다.
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str
    memo: Optional[str] = None
    # 할일 구분용 이모지 카테고리 (자유 문자열, 예: "📚"). 프론트가 값을 그대로 렌더링한다.
    category: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: bool = False
    # 마감 임박 알림을 이미 보냈는지 여부 — 중복 발송 방지용 내부 플래그.
    notified: bool = False
    created_at: datetime = Field(default_factory=now_kst)
