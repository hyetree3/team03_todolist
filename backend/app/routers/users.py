"""로그인한 내 정보 조회. 지금은 point 확인용이지만, 나중에 나무/캐릭터 상태 등을
보여줄 때도 이 엔드포인트를 계속 쓰게 될 것."""
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from app.database import get_session
from app.deps import get_current_user
from app.models import PointLog, User
from app.schemas import PointDayEntry, PointHistory, UserRead, UserSettingsUpdate
from app.timeutil import period_range

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
def update_my_settings(
    payload: UserSettingsUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """설정 화면에서 알림 연동 정보(email/discord_id/alarm_style)를 나중에 채우거나 바꿀 때 쓴다.
    보낸 필드만 수정된다."""
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/me/points", response_model=PointHistory)
def get_my_point_history(
    period: Literal["today", "week", "month", "year"] = "today",
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """기간 동안 하루하루 몇 포인트씩 쌓였는지 (나무/캐릭터 성장 기록용).
    포인트 변화가 없던 날도 0으로 채워서 매일 빠짐없이 내려준다."""
    start, end = period_range(period)
    start_date, end_date = start.date(), end.date()

    rows = session.exec(
        select(PointLog.pointdate, func.sum(PointLog.point))
        .where(
            PointLog.user_id == user.id,
            PointLog.pointdate >= start_date,
            PointLog.pointdate < end_date,
        )
        .group_by(PointLog.pointdate)
    ).all()
    points_by_date = {d.isoformat(): int(total) for d, total in rows}

    days = []
    cursor = start_date
    while cursor < end_date:
        date_str = cursor.isoformat()
        days.append(PointDayEntry(date=date_str, points=points_by_date.get(date_str, 0)))
        cursor += timedelta(days=1)

    total = sum(day.points for day in days)
    return PointHistory(period=period, total=total, days=days)
