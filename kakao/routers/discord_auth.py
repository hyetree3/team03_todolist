"""
Discord OAuth 라우터.

routers/google_auth.py와 동일한 패턴 — 지금 단계에서는 독립 실행 서버를 띄우지 않고
코드만 준비해둔다. 나중에 백엔드(혜림님) FastAPI 앱이 만들어지면 다음과 같이 합치면 된다:

    from routers.discord_auth import router as discord_auth_router
    app.include_router(discord_auth_router)

DISCORD_REDIRECT_URI(.env)가 이 라우터의 /auth/discord/callback 경로와
백엔드 앱의 실제 포트에 맞게 설정되어 있어야 하고, Developer Portal의
OAuth2 > Redirects에도 동일한 주소가 등록되어 있어야 한다.
"""

from fastapi import APIRouter, HTTPException, Query

from db import get_session
from discord_oauth import build_auth_url, exchange_code_for_discord_id
from models import User

router = APIRouter(prefix="/auth/discord", tags=["discord-oauth"])


@router.get("/login")
def discord_login(user_id: int = Query(..., description="연동할 로그인 유저의 id")):
    """프론트엔드의 'Discord 연동' 버튼이 이 엔드포인트를 호출하고,
    응답으로 받은 auth_url로 사용자를 리다이렉트시키면 된다."""
    auth_url = build_auth_url(state=str(user_id))
    return {"auth_url": auth_url}


@router.get("/callback")
def discord_callback(code: str, state: str):
    """Discord가 인가 코드(code)와 함께 리다이렉트하는 콜백. state=user_id."""
    try:
        user_id = int(state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="잘못된 state 값입니다.") from exc

    discord_id, username = exchange_code_for_discord_id(code)

    with get_session() as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="해당 유저를 찾을 수 없습니다.")
        user.discord_id = discord_id
        session.add(user)
        session.commit()

    return {"message": f"Discord 연동이 완료되었습니다. ({username})"}
