"""알림 발송 로직을 한 곳에 모아둔 모듈.

채널(디스코드/텔레그램)이 아직 정해지지 않았기 때문에, 스케줄러 등 다른 코드는
send_notification(text)만 호출하고 채널별 구현은 절대 모른다.
채널이 정해지면 이 파일 안의 구현과 .env만 바꾸면 된다.
"""
import requests

from app.config import (
    DISCORD_WEBHOOK_URL,
    NOTIFY_TARGET,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
)


def send_notification(text: str) -> bool:
    """텍스트 메시지를 팀 공용 알림 채널로 보낸다. 성공하면 True."""
    if NOTIFY_TARGET == "discord":
        return _send_discord(text)
    if NOTIFY_TARGET == "telegram":
        return _send_telegram(text)

    # 채널이 아직 설정 안 됐으면 조용히 실패 처리 (앱이 죽으면 안 되니까).
    return False


def _send_discord(text: str) -> bool:
    if not DISCORD_WEBHOOK_URL:
        return False
    try:
        res = requests.post(DISCORD_WEBHOOK_URL, json={"content": text}, timeout=5)
        return res.ok
    except requests.RequestException:
        return False


def _send_telegram(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        res = requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": text}, timeout=5)
        return res.ok
    except requests.RequestException:
        return False
