"""로그인한 내 정보 조회. 지금은 point 확인용이지만, 나중에 나무/캐릭터 상태 등을
보여줄 때도 이 엔드포인트를 계속 쓰게 될 것."""
from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.schemas import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)):
    return user
