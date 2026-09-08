"""FastAPI 앱 진입점. `uvicorn main:app --reload`로 실행."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.point_scheduler import start_point_scheduler
from app.routers import auth, todos, users

# 마감 임박 개인 알림(디스코드 DM/구글 캘린더)은 kakao 모듈이 전담하기로 결정함.
# backend 스케줄러(app/scheduler.py)까지 같이 켜두면 같은 todos.notified 플래그를
# 두 스케줄러가 동시에 갱신하려고 경쟁해서 중복/누락 발송이 생기므로 여기선 껐다.
# app/scheduler.py 코드 자체는 참고용으로 남겨둠 (kakao 쪽 공용 채널 폴백 구현 시 재사용 가능).
# from app.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_point_scheduler()
    yield


app = FastAPI(title="Todo 앱 백엔드", lifespan=lifespan)

# 프론트는 다른 포트에서 호출하고 Authorization 헤더로 토큰을 보내므로
# CORS에서 Authorization 헤더를 반드시 허용해야 한다 (초보 팀 단골 함정).
# 쿠키는 안 쓰므로 allow_credentials는 False로 두고 origin은 전부 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(users.router)
