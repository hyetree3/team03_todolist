"""FastAPI 앱 진입점. `uvicorn main:app --reload`로 실행."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, todos
from app.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
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
