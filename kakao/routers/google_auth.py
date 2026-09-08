"""
Google Calendar OAuth 라우터.

지금 단계에서는 독립 실행 서버를 띄우지 않고 코드만 준비해둔다.
나중에 백엔드(혜림님) FastAPI 앱이 만들어지면 다음과 같이 합치면 된다:

    from routers.google_auth import router as google_auth_router
    app.include_router(google_auth_router)

GOOGLE_REDIRECT_URI(.env)가 이 라우터의 /auth/google/callback 경로와
백엔드 앱의 실제 포트에 맞게 설정되어 있어야 한다.
"""

from fastapi import APIRouter, HTTPException, Query

from crypto_utils import encrypt
from db import get_session
from google_calendar import build_auth_url, exchange_code_for_refresh_token
from models import User

router = APIRouter(prefix="/auth/google", tags=["google-calendar"])


@router.get("/login")
def google_login(user_id: int = Query(..., description="연동할 로그인 유저의 id")):
    """프론트엔드의 '구글 캘린더 연동' 버튼이 이 엔드포인트를 호출하고,
    응답으로 받은 auth_url로 사용자를 리다이렉트시키면 된다."""
    auth_url = build_auth_url(state=str(user_id))
    return {"auth_url": auth_url}


@router.get("/callback")
def google_callback(code: str, state: str):
    """구글이 인가 코드(code)와 함께 리다이렉트하는 콜백. state=user_id."""
    try:
        user_id = int(state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="잘못된 state 값입니다.") from exc

    refresh_token = exchange_code_for_refresh_token(code)
    encrypted_token = encrypt(refresh_token)

    with get_session() as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="해당 유저를 찾을 수 없습니다.")
        user.google_refresh_token_encrypted = encrypted_token
        # 프론트가 진짜 토큰 대신 이 boolean으로 "연동됨"을 판단한다 (backend/app/models.py 참고).
        user.calender_alarm = True
        session.add(user)
        session.commit()

    return {"message": "구글 캘린더 연동이 완료되었습니다."}
