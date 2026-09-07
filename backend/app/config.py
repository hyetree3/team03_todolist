"""환경변수 로딩. .env 파일에서 비밀값을 읽어온다 (코드에 하드코딩 금지)."""
import os

from dotenv import load_dotenv

load_dotenv()

# JWT 서명 키 — 반드시 .env에서 채워야 한다.
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24시간

# 알림 채널 설정
NOTIFY_TARGET = os.getenv("NOTIFY_TARGET", "discord")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# DB
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

if not SECRET_KEY:
    # 서버 기동 시점에 바로 알아채도록 명시적으로 경고한다.
    raise RuntimeError("SECRET_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
