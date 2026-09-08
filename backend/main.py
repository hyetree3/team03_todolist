"""FastAPI 앱 진입점. `uvicorn main:app --reload`로 실행."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.notification_scheduler import start_notification_scheduler
from app.point_scheduler import start_point_scheduler
from app.routers import auth, discord_auth, google_auth, todos, users

# 할일은 오직 이 backend API를 통해서만 생성/수정/삭제되므로(프론트엔드 -> 이 API가
# 유일한 경로), 개인 알림(디스코드 DM/구글 캘린더)도 kakao의 별도 폴링 프로세스에
# 맡기지 않고 이 backend가 생성/삭제 시점에 직접 처리한다 (app/notification_scheduler.py).
# kakao 프로세스는 더 이상 알림용으로 켜둘 필요가 없고, /start 슬래시커맨드 보조 용도로만
# 남는다 (kakao/README.md 참고). app/scheduler.py, app/notifications.py는 팀 공용 채널
# 공지용으로 남겨둔 참고 코드일 뿐 호출되지 않는다.
# from app.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_point_scheduler()
    start_notification_scheduler()
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
# kakao 파트(재원)의 Discord/Google 연동 OAuth 라우터 — 콜백이 이 프로세스의 포트를
# 향하고 있어 별도 프로세스가 아니라 이 FastAPI 앱 안에서 직접 떠 있어야 한다.
app.include_router(discord_auth.router)
app.include_router(google_auth.router)
