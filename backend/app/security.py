"""비밀번호 해싱 + JWT 발급/검증. 직접 암호 로직을 짜지 않고 표준 라이브러리(bcrypt, jose)만 쓴다."""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY


def hash_password(plain_password: str) -> str:
    """bcrypt로 비밀번호를 해싱한다. 결과는 그대로 DB에 저장 가능한 문자열."""
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(username: str) -> str:
    """로그인한 유저의 username을 담은 JWT를 발급한다."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """토큰이 유효하면 username(sub)을 반환하고, 아니면 None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    return payload.get("sub")
