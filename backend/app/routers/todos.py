"""할일 CRUD API. 전부 로그인 필요, 본인 소유 할일만 조회/조작 가능."""
from datetime import timedelta
from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.database import get_session
from app.deps import get_current_user
from app.models import PointLog, Todo, User
from app.notification_scheduler import cleanup_calendar_event, handle_todo_created, schedule_due_soon
from app.schemas import (
    CategoryStat,
    DailyCompletion,
    DateRange,
    TodoCreate,
    TodoRead,
    TodoStats,
    TodoUpdate,
)
from app.timeutil import WEEKDAY_KR, now_kst, period_range, previous_period_range

router = APIRouter(prefix="/todos", tags=["todos"])

# 할일 완료 1건당 적립되는 포인트. 나중에 캐릭터/나무 키우기 기능에서 이 값을 쌓아서 쓴다.
POINTS_PER_COMPLETION = 10


def _get_owned_todo(todo_id: int, user: User, session: Session) -> Todo:
    """내 소유의 할일만 가져온다. 남의 할일이거나 없으면 404 (존재 여부를 숨긴다)."""
    todo = session.get(Todo, todo_id)
    if not todo or todo.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="할일을 찾을 수 없습니다.")
    return todo


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todo = Todo(
        user_id=user.id,
        title=payload.title,
        memo=payload.memo,
        category=payload.category,
        due_at=payload.due_at,
    )
    session.add(todo)
    session.commit()
    session.refresh(todo)
    # 응답을 기다리게 하지 않고, 생성 알림(Discord DM)/구글 캘린더 등록을 백그라운드로 처리한다.
    background_tasks.add_task(handle_todo_created, todo.id)
    return todo


@router.get("", response_model=list[TodoRead])
def list_todos(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todos = session.exec(select(Todo).where(Todo.user_id == user.id)).all()
    return todos


@router.get("/stats", response_model=TodoStats)
def get_todo_stats(
    period: Literal["today", "week", "month", "year"] = "week",
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """통계 화면용. 완료 개수/포인트(+직전 기간 대비 증감율), 요일별 완료 추이,
    카테고리 비율(완료/미완료 상관없이 그 기간에 마감인 할일 전체 기준)을 한 번에 준다."""
    start, end = period_range(period)
    prev_start, prev_end = previous_period_range(period, start, end)

    def completed_count_and_daily(range_start, range_end):
        # 할일(todo_id)별로 "가장 최근" point_log 행 하나만 본다 — 완료/취소를 몇 번
        # 반복했든 최종 상태 기준으로 날짜당 1건만 잡히게 하기 위함(완료 이벤트를
        # 그냥 다 세면 취소된 것까지 중복으로 잡혀서 실제 완료 개수보다 부풀려짐).
        latest_id_subq = (
            select(func.max(PointLog.id))
            .where(PointLog.user_id == user.id, PointLog.todo_id.is_not(None))
            .group_by(PointLog.todo_id)
        )
        rows = session.exec(
            select(PointLog.pointdate, func.count())
            .where(
                PointLog.id.in_(latest_id_subq),
                PointLog.point > 0,  # 최종 상태가 완료(+10)인 것만 — 취소로 끝난 건 제외
                PointLog.pointdate >= range_start.date(),
                PointLog.pointdate < range_end.date(),
            )
            .group_by(PointLog.pointdate)
        ).all()
        return {d.isoformat(): c for d, c in rows}

    def points_total(range_start, range_end):
        total = session.exec(
            select(func.sum(PointLog.point)).where(
                PointLog.user_id == user.id,
                PointLog.pointdate >= range_start.date(),
                PointLog.pointdate < range_end.date(),
            )
        ).one()
        return int(total or 0)

    def pct_change(current: int, previous: int) -> Optional[float]:
        if previous == 0:
            return None
        return round((current - previous) / previous * 100, 1)

    counts_by_date = completed_count_and_daily(start, end)
    completed_count = sum(counts_by_date.values())
    prev_completed_count = sum(completed_count_and_daily(prev_start, prev_end).values())

    current_points = points_total(start, end)
    prev_points = points_total(prev_start, prev_end)

    daily: list[DailyCompletion] = []
    cursor = start.date()
    while cursor < end.date():
        date_str = cursor.isoformat()
        daily.append(DailyCompletion(
            date=date_str,
            weekday=WEEKDAY_KR[cursor.weekday()],
            count=counts_by_date.get(date_str, 0),
        ))
        cursor += timedelta(days=1)

    busiest_day = max(daily, key=lambda d: d.count) if daily and any(d.count for d in daily) else None

    category_rows = session.exec(
        select(Todo.category, func.count())
        .where(
            Todo.user_id == user.id,
            Todo.due_at >= start,
            Todo.due_at < end,
        )
        .group_by(Todo.category)
    ).all()
    total_categorized = sum(count for _, count in category_rows) or 1
    by_category = [
        CategoryStat(category=category, count=count, ratio=round(count / total_categorized, 3))
        for category, count in category_rows
    ]

    return TodoStats(
        period=period,
        range=DateRange(start=start.date().isoformat(), end=(end.date() - timedelta(days=1)).isoformat()),
        completed_count=completed_count,
        completed_count_change_pct=pct_change(completed_count, prev_completed_count),
        points_total=current_points,
        points_change_pct=pct_change(current_points, prev_points),
        busiest_day=busiest_day,
        daily=daily,
        by_category=by_category,
    )


@router.get("/{todo_id}", response_model=TodoRead)
def get_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return _get_owned_todo(todo_id, user, session)


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todo = _get_owned_todo(todo_id, user, session)
    was_done = todo.is_done

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(todo, field, value)

    # 마감 시각이나 완료 상태가 바뀌면 다시 알림 대상이 될 수 있으므로 플래그를 초기화한다.
    if "due_at" in data or "is_done" in data:
        todo.notified = False

    # 완료로 바뀔 때만 포인트 적립, 다시 미완료로 되돌리면 회수한다
    # (완료/취소를 반복해서 포인트를 무한정 버는 것을 막기 위함).
    # 포인트는 평생 누적이 아니라 "그날 그날" 개념이라 user 테이블엔 안 쌓고,
    # point_logs에 기록만 남긴다 — 오늘 몇 점인지는 그때그때 이 로그를 합산해서 구한다.
    if "is_done" in data and todo.is_done != was_done:
        delta = POINTS_PER_COMPLETION if todo.is_done else -POINTS_PER_COMPLETION
        session.add(PointLog(user_id=user.id, todo_id=todo.id, point=delta, pointdate=now_kst().date()))

    session.add(todo)
    session.commit()
    session.refresh(todo)

    # 마감 시각이 새로 생겼거나 바뀌었으면 "마감 1시간 전" 예약도 그 새 시각에 맞춰 다시 건다.
    if "due_at" in data and todo.due_at and not todo.is_done:
        background_tasks.add_task(schedule_due_soon, todo.id, todo.due_at)

    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todo = _get_owned_todo(todo_id, user, session)
    session.delete(todo)
    session.commit()
    # 이 할일 때문에 만들어졌던 구글 캘린더 이벤트가 있으면 바로 지운다.
    background_tasks.add_task(cleanup_calendar_event, todo_id, user.id)
