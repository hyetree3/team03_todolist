"""DB 테이블 정의 (SQLModel). users / todos."""
from datetime import date, datetime
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
    # 구글 캘린더 연동 완료 여부. refresh_token 값 자체는 내부 전용이라 노출 안 하는 대신,
    # 프론트가 "연동됨/안됨"만 판단할 수 있게 이 boolean을 따로 둔다. OAuth 콜백 성공 시 True로 바뀜.
    calender_alarm: bool = Field(default=False)
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


class PointLog(SQLModel, table=True):
    """날짜별 포인트 기록. 포인트는 평생 누적이 아니라 "그날 그날"의 개념이라 users
    테이블엔 총합 컬럼을 따로 안 두고, 이 로그를 날짜별로 묶어서 그날그날의
    포인트(=식물 성장 단계)를 계산한다.

    매일 자정에 계정마다 point=0, todo_id=None인 "그날의 기본 행"이 하나 생기고
    (app/point_scheduler.py), 할일을 완료/취소할 때마다 todo_id가 채워진 행이 추가로 쌓인다.
    그날의 포인트 = 그 날짜(pointdate)에 해당하는 모든 행의 point 합."""
    __tablename__ = "point_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    # 어떤 할일 때문에 생긴 변화인지. 자정에 자동 생성되는 "그날의 기본 행"은 특정 할일이
    # 없어서 None.
    todo_id: Optional[int] = Field(default=None, foreign_key="todos.id")
    point: int = Field(default=0)  # 완료 시 +10, 완료 취소 시 -10, 자정 기본 행은 0
    pointdate: date = Field(default_factory=lambda: now_kst().date(), index=True)
