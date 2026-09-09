"""Discord REST API로 DM을 보낸다 — 게이트웨이(봇 프로세스) 접속이 필요 없다.

봇이 사용자 계정에 이미 설치되어 있으면(Discord 연동 시 applications.commands 스코프로
설치됨, app/discord_oauth.py 참고) 봇 토큰만으로 DM 채널을 열고 메시지를 보낼 수 있다.
discord.py의 Client(게이트웨이 연결, kakao/discord_bot.py)는 /start 같은 실시간
상호작용에만 필요하고, 단순 발송에는 필요 없다 — 그래서 이 REST 방식을 쓰면 backend가
할일을 만드는 그 순간 바로, 별도 봇 프로세스 없이 DM을 보낼 수 있다.
"""
import os

import requests
from dotenv import load_dotenv

load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
API_BASE = "https://discord.com/api/v10"


def send_dm(discord_id: str, content: str) -> bool:
    """discord_id로 유저에게 DM 발송을 시도한다. 성공하면 True, 실패하면 False."""
    if not DISCORD_BOT_TOKEN:
        print("[discord_dm] DISCORD_BOT_TOKEN이 .env에 설정되어 있지 않습니다.")
        return False

    headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN}"}
    try:
        channel_res = requests.post(
            f"{API_BASE}/users/@me/channels",
            json={"recipient_id": str(discord_id)},
            headers=headers,
            timeout=10,
        )
        channel_res.raise_for_status()
        channel_id = channel_res.json()["id"]

        message_res = requests.post(
            f"{API_BASE}/channels/{channel_id}/messages",
            json={"content": content},
            headers=headers,
            timeout=10,
        )
        message_res.raise_for_status()
        return True
    except requests.RequestException as exc:
        print(f"[discord_dm] DM 발송 실패 (discord_id={discord_id}): {exc}")
        return False
