"""할일 CRUD API. 전부 로그인 필요, 본인 소유 할일만 조회/조작 가능."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import PointLog, Todo, User
from app.schemas import TodoCreate, TodoRead, TodoUpdate
from app.timeutil import now_kst

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
