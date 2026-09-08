import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def _client_config() -> dict:
    return {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }


def build_auth_url(state: str) -> str:
    """state에는 어떤 유저의 연동 요청인지 식별할 수 있는 값(user_id)을 넣는다."""
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES, state=state)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",  # refresh_token을 매번 다시 받기 위해 필요
    )
    return auth_url


def exchange_code_for_refresh_token(code: str) -> str:
    flow = Flow.from_client_config(_client_config(), scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    flow.fetch_token(code=code)
    credentials = flow.credentials
    if not credentials.refresh_token:
        raise RuntimeError(
            "refresh_token을 받지 못했습니다. 이미 한 번 동의한 계정이면 "
            "Google 계정 설정에서 앱 연결을 해제한 뒤 다시 시도해야 합니다."
        )
    return credentials.refresh_token


def _credentials_from_refresh_token(refresh_token: str) -> Credentials:
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )


def create_reminder_event(refresh_token: str, title: str, due_at: datetime) -> str:
    """마감 1시간 전 알림용으로 구글 캘린더에 일정을 생성하고, 생성된 이벤트 id를 반환."""
    credentials = _credentials_from_refresh_token(refresh_token)
    service = build("calendar", "v3", credentials=credentials)

    # due_at은 backend가 KST naive datetime으로 저장한 값이다(timeutil.now_kst() 참고).
    # offset 없는 isoformat()만 보내면 Google이 UTC로 오인하므로, timeZone을 명시해야 한다.
    event_body = {
        "summary": f"[TODO 마감] {title}",
        "description": "TODO LIST 알림 서비스에서 자동으로 생성된 일정입니다.",
        "start": {"dateTime": due_at.isoformat(), "timeZone": "Asia/Seoul"},
        "end": {
            "dateTime": (due_at + timedelta(minutes=30)).isoformat(),
            "timeZone": "Asia/Seoul",
        },
        "reminders": {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": 60}],
        },
    }
    created_event = service.events().insert(calendarId="primary", body=event_body).execute()
    return created_event["id"]
