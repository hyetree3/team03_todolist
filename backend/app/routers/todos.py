"""할일 CRUD API. 전부 로그인 필요, 본인 소유 할일만 조회/조작 가능."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Todo, User
from app.schemas import TodoCreate, TodoRead, TodoStats, TodoUpdate
from app.timeutil import period_range

router = APIRouter(prefix="/todos", tags=["todos"])


def _get_owned_todo(todo_id: int, user: User, session: Session) -> Todo:
    """내 소유의 할일만 가져온다. 남의 할일이거나 없으면 404 (존재 여부를 숨긴다)."""
    todo = session.get(Todo, todo_id)
    if not todo or todo.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="할일을 찾을 수 없습니다.")
    return todo


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
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
    period: Literal["today", "week", "month", "year"] = "today",
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """기간별(오늘/이번주/이번달/올해) 완료율. due_at이 그 기간 안에 있는 할일만 집계 대상
    (마감 없는 할일은 특정 기간에 속한다고 볼 수 없어서 집계에서 제외)."""
    start, end = period_range(period)

    total = session.exec(
        select(func.count()).select_from(Todo).where(
            Todo.user_id == user.id,
            Todo.due_at >= start,
            Todo.due_at < end,
        )
    ).one()
    completed = session.exec(
        select(func.count()).select_from(Todo).where(
            Todo.user_id == user.id,
            Todo.due_at >= start,
            Todo.due_at < end,
            Todo.is_done == True,  # noqa: E712
        )
    ).one()

    completion_rate = completed / total if total > 0 else 0.0
    return TodoStats(total=total, completed=completed, completion_rate=completion_rate)


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
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todo = _get_owned_todo(todo_id, user, session)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(todo, field, value)

    # 마감 시각이나 완료 상태가 바뀌면 다시 알림 대상이 될 수 있으므로 플래그를 초기화한다.
    if "due_at" in data or "is_done" in data:
        todo.notified = False

    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    todo = _get_owned_todo(todo_id, user, session)
    session.delete(todo)
    session.commit()
