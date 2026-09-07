"""보호된 엔드포인트에서 쓰는 공용 의존성: 헤더의 Bearer 토큰 -> 현재 로그인한 User."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.security import decode_access_token

# /auth/login이 JSON body(username/password)를 쓰는 계약이라서(API 계약서 참고),
# 폼 데이터를 요구하는 OAuth2PasswordBearer 대신 순수 Bearer 토큰 스킴을 쓴다.
# /docs에서는 로그인 응답의 access_token을 복사해 Authorize에 붙여넣으면 된다.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    username = decode_access_token(credentials.credentials)
    if username is None:
        raise unauthorized

    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise unauthorized

    return user
