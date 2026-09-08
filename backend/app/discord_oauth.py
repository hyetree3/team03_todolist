"""Discord OAuth2 플로우. kakao 파트 코드를 backend로 이식함.

사용자가 숫자 ID를 직접 몰라도 되도록, 인증 한 번으로 (1) 진짜 Discord 숫자 ID를
자동으로 알아내고 (2) applications.commands 스코프를 함께 요청해서 User-Install 앱
설치까지 같이 이뤄지게 한다 (이후 kakao 알림 프로세스의 예약 DM이 막히지 않으려면
이 설치가 필요함).
"""
import os
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv

load_dotenv()

DISCORD_APPLICATION_ID = os.getenv("DISCORD_APPLICATION_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI")

AUTHORIZE_URL = "https://discord.com/oauth2/authorize"
TOKEN_URL = "https://discord.com/api/oauth2/token"
ME_URL = "https://discord.com/api/users/@me"

# identify: 본인 프로필(숫자 id, username) 조회용.
# applications.commands: User-Install 앱 설치 (송신용 접점 확보 목적).
SCOPES = "identify applications.commands"


def build_auth_url(state: str) -> str:
    """state에는 어떤 유저의 연동 요청인지 식별할 값(우리 앱의 user_id)을 넣는다."""
    params = {
        "client_id": DISCORD_APPLICATION_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": state,
        "prompt": "consent",
        # 1 = 사용자 계정에 설치(User Install). 이게 없으면 Discord가
        # "내 앱/서버 중 어디에 추가할지" 다시 물어보는 화면을 띄운다.
        "integration_type": 1,
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}"


def exchange_code_for_discord_id(code: str) -> tuple[str, str]:
    """code를 access token으로 교환하고, 그 토큰으로 본인 프로필을 조회한다.
    반환값: (discord_id, username)."""
    token_res = requests.post(
        TOKEN_URL,
        data={
            "client_id": DISCORD_APPLICATION_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": DISCORD_REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    token_res.raise_for_status()
    access_token = token_res.json()["access_token"]

    me_res = requests.get(
        ME_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    me_res.raise_for_status()
    me = me_res.json()
    return me["id"], me["username"]
