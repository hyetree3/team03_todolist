"""Google Calendar OAuth 라우터. kakao 파트(재원)가 준비한 코드를 backend FastAPI 앱으로
이식함 — 콜백 주소(GOOGLE_REDIRECT_URI)가 backend 포트를 향하고 있어 backend 프로세스
안에서 직접 떠 있어야 한다.

kakao 원본과의 차이: /login이 쿼리 파라미터로 받은 user_id를 그대로 신뢰하던 방식에서,
로그인한 본인(Authorization 헤더)만 자신의 계정에 연동을 시작할 수 있도록 바꿨다
(그렇지 않으면 다른 사람의 user_id를 넣어 계정을 가로챌 수 있음).
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.config import FRONTEND_BASE_URL
from app.crypto_utils import decrypt, encrypt
from app.database import engine, get_session
from app.deps import get_current_user
from app.google_calendar import build_auth_url, delete_event, exchange_code_for_refresh_token
from app.models import CalendarEventLog, User
from app.schemas import UserRead

router = APIRouter(prefix="/auth/google", tags=["google-calendar"])


@router.get("/login")
def google_login(user: User = Depends(get_current_user)):
    """프론트엔드의 '구글 캘린더 연동' 버튼이 (로그인 토큰을 실어) 이 엔드포인트를 호출하고,
    응답으로 받은 auth_url로 사용자를 리다이렉트시키면 된다."""
    auth_url = build_auth_url(state=str(user.id))
    return {"auth_url": auth_url}


@router.get("/callback")
def google_callback(code: str, state: str):
    """구글이 인가 코드(code)와 함께 리다이렉트하는 콜백. state=user_id.
    성공/실패 모두 프론트 설정 화면으로 다시 리다이렉트한다."""
    try:
        user_id = int(state)
    except ValueError:
        return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=google&status=error")

    try:
        refresh_token = exchange_code_for_refresh_token(code)
    except Exception:
        return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=google&status=error")
    encrypted_token = encrypt(refresh_token)

    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="해당 유저를 찾을 수 없습니다.")
        user.google_refresh_token_encrypted = encrypted_token
        # 프론트가 진짜 토큰 대신 이 boolean으로 "연동됨"을 판단한다.
        user.calender_alarm = True
        session.add(user)
        session.commit()

    return RedirectResponse(f"{FRONTEND_BASE_URL}/settings?connected=google&status=success")


@router.delete("/disconnect", response_model=UserRead)
def google_disconnect(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """구글 캘린더 연동을 해제한다. 토큰을 지우기 전에, 이미 만들어둔 캘린더 이벤트를
    먼저 정리한다 — 안 그러면 토큰이 사라진 뒤에는 그 이벤트를 지울 방법이 없어져서
    캘린더에 영영 남게 된다."""
    if user.google_refresh_token_encrypted:
        refresh_token = decrypt(user.google_refresh_token_encrypted)
        logs = session.exec(
            select(CalendarEventLog).where(CalendarEventLog.user_id == user.id)
        ).all()
        for log in logs:
            try:
                delete_event(refresh_token, log.event_id)
            except Exception:  # noqa: BLE001 - 외부 API 실패해도 연동 해제 자체는 계속 진행
                pass
            session.delete(log)

    user.google_refresh_token_encrypted = None
    user.calender_alarm = False
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
