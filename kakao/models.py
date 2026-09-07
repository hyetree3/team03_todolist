from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # 구글 이메일 - 선택 항목, 구글 캘린더 연동
    email: str | None = Field(default=None)
    # 디스코드 ID - 선택 항목, 회원가입 시 입력받아 저장 (개인별 디스코드 알림)
    discord_id: str | None = Field(default=None)

    # kakao 파트에서 필요해서 추가한 컬럼 (CLAUD.md 기본 스키마에는 없음):
    # 구글 캘린더 refresh token을 암호화해서 저장. 값이 있으면 "구글 캘린더 연동됨"으로 취급.
    google_refresh_token_encrypted: str | None = Field(default=None)


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    title: str
    due_at: datetime | None = Field(default=None)
    is_done: bool = Field(default=False)
    # 알림 발송됨 여부 - 중복 발송 방지용 내부 플래그
    notified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
