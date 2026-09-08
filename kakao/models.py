from datetime import datetime

from sqlmodel import Field, SQLModel

from timeutil import now_kst

# 2026-09-08: backend/app/models.py가 확정한 최종 스키마에 맞춰 필드를 동기화했다.
# (memo/category/point/alarm_style 추가, created_at을 UTC가 아니라 KST naive로 통일)
# 이 파일은 backend와 독립된 정의이므로, backend 쪽 스키마가 또 바뀌면 여기도 같이 맞춰야 한다.


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=now_kst)

    # 구글 이메일 - 선택 항목, 구글 캘린더 연동
    email: str | None = Field(default=None)
    # 디스코드 ID - 선택 항목, 회원가입 시 입력받아 저장 (개인별 디스코드 알림)
    discord_id: str | None = Field(default=None)

    # 구글 캘린더 refresh token을 암호화해서 저장. 값이 있으면 "구글 캘린더 연동됨"으로 취급.
    # (2026-09-08 확인: backend/app/models.py에도 같은 이름으로 이미 추가되어 있음)
    google_refresh_token_encrypted: str | None = Field(default=None)
    # 할일 완료 시 쌓이는 포인트 (backend가 관리, kakao는 읽기만 함 — 알림 로직엔 안 쓰임)
    point: int = Field(default=0)
    # 알림 말투 스타일 (love/normal/nagging). kakao의 messages.build_message()가 이 값을 본다.
    alarm_style: str = Field(default="normal")


class Todo(SQLModel, table=True):
    __tablename__ = "todos"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    title: str
    memo: str | None = Field(default=None)
    category: str | None = Field(default=None)
    due_at: datetime | None = Field(default=None)
    is_done: bool = Field(default=False)
    # 알림 발송됨 여부 - 중복 발송 방지용 내부 플래그 ("마감 1시간 전" 알림용)
    notified: bool = Field(default=False)
    # "할일이 생성됐어요" 알림을 이미 보냈는지 여부 (2026-09-08 추가, kakao 전용 컬럼 —
    # backend/app/models.py에는 아직 없음, 통합 시 요청해야 함). notified와는 별개로,
    # 생성 직후 한 번만 보내는 알림용 플래그.
    created_notified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=now_kst)
