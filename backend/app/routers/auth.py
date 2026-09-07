"""회원가입 / 로그인. 자체 아이디-비밀번호만 사용 (소셜 로그인 없음)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserRead
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 사용 중인 아이디입니다.")

    # 비밀번호는 절대 평문으로 저장하지 않는다.
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        email=payload.email,
        discord_id=payload.discord_id,
        alarm_style=payload.alarm_style,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == payload.username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token(user.username)
    return Token(access_token=token)
