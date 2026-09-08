"""요청/응답 Pydantic v2 스키마. 내부 전용 필드(password_hash, user_id, notified)는
여기서 아예 제외해서 API 응답에 노출되지 않도록 한다."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

# 할일 구분용 카테고리. 이모지 자유 문자열이었다가, 고정된 4개 중 하나만 고르는 방식으로 변경.
TodoCategory = Literal["중요", "업무", "개인", "기타"]


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
    category: Optional[TodoCategory] = None
    due_at: Optional[datetime] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    memo: Optional[str] = None
    category: Optional[TodoCategory] = None
    due_at: Optional[datetime] = None
    is_done: Optional[bool] = None


class TodoRead(BaseModel):
    id: int
    title: str
    memo: Optional[str] = None
    category: Optional[TodoCategory] = None
    due_at: Optional[datetime] = None
    is_done: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- 통계 (통계 화면용) ----------
class DateRange(BaseModel):
    start: str  # "YYYY-MM-DD"
    end: str    # "YYYY-MM-DD" (포함, 사람이 읽는 용도)


class DailyCompletion(BaseModel):
    date: str
    weekday: str  # "일"~"토"
    count: int    # 그날 완료 처리된 할일 개수


class CategoryStat(BaseModel):
    category: Optional[TodoCategory]
    count: int
    ratio: float  # 0~1


class TodoStats(BaseModel):
    period: Literal["today", "week", "month", "year"]
    range: DateRange
    completed_count: int
    completed_count_change_pct: Optional[float]  # 직전 기간 대비 증감율(%). 직전이 0이면 null
    points_total: int
    points_change_pct: Optional[float]
    busiest_day: Optional[DailyCompletion]  # 완료가 하나도 없으면 null
    daily: list[DailyCompletion]
    by_category: list[CategoryStat]  # 완료/미완료 상관없이 그 기간에 마감(due_at)인 할일 전체 기준
