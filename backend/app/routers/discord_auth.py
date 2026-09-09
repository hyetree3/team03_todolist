"""Discord OAuth 라우터. kakao 파트(재원)가 준비한 코드를 backend FastAPI 앱으로 이식함 —
콜백 주소(DISCORD_REDIRECT_URI)가 backend 포트를 향하고 있어 backend 프로세스 안에서
직접 떠 있어야 한다.

kakao 원본과의 차이: /login이 쿼리 파라미터로 받은 user_id를 그대로 신뢰하던 방식에서,
로그인한 본인(Authorization 헤더)만 자신의 계정에 연동을 시작할 수 있도록 바꿨다
(그렇지 않으면 다른 사람의 user_id를 넣어 계정을 가로챌 수 있음).
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from app.config import FRONTEND_BASE_URL
from app.database import engine, get_session
from app.deps import get_current_user
from app.discord_oauth import build_auth_url, exchange_code_for_discord_id
from app.models import User
from app.schemas import UserRead

router = APIRouter(prefix="/auth/discord", tags=["discord-oauth"])


@router.get("/login")
def discord_login(user: User = Depends(get_current_user)):
    """프론트엔드의 'Discord 연동' 버튼이 (로그인 토큰을 실어) 이 엔드포인트를 호출하고,
    응답으로 받은 auth_url로 사용자를 리다이렉트시키면 된다."""
    auth_url = build_auth_url(state=str(user.id))
    return {"auth_url": auth_url}


@router.get("/callback")
def discord_callback(code: str, state: str):
    """Discord가 인가 코드(code)와 함께 리다이렉트하는 콜백. state=user_id.
    성공/실패 모두 프론트 설정 화면으로 다시 리다이렉트한다."""
    try:
        user_id = int(state)
    except ValueError:
        return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=discord&status=error")

    try:
        discord_id, _username = exchange_code_for_discord_id(code)
    except Exception:
        return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=discord&status=error")

    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="해당 유저를 찾을 수 없습니다.")
        user.discord_id = discord_id
        session.add(user)
        session.commit()

    return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=discord&status=success")


@router.delete("/disconnect", response_model=UserRead)
def discord_disconnect(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Discord 연동을 해제한다."""
    user.discord_id = None
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
