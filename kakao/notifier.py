from crypto_utils import decrypt
from discord_bot import send_dm
from google_calendar import create_reminder_event
from messages import build_message
from models import Todo, User


async def send_notification(user: User, todo: Todo) -> bool:
    """
    user.discord_id가 있으면 Discord DM을, google_refresh_token_encrypted가 있으면
    구글 캘린더 알림을 시도한다. Discord 문구는 user.alarm_style(love/normal/nagging)에
    맞춰 랜덤으로 고른다 (messages.build_message 참고).

    최소 한 가지 채널을 시도했고, 시도한 채널이 전부 성공했을 때만 True를 반환한다.
    연동된 채널이 하나도 없으면(발송할 곳이 없음) False를 반환해 notified를 갱신하지 않는다.
    """
    attempted = False
    all_succeeded = True

    if user.discord_id:
        attempted = True
        text = build_message(user.alarm_style, todo.title)
        ok = await send_dm(user.discord_id, text)
        all_succeeded = all_succeeded and ok

    if user.google_refresh_token_encrypted and todo.due_at:
        attempted = True
        try:
            refresh_token = decrypt(user.google_refresh_token_encrypted)
            create_reminder_event(refresh_token, todo.title, todo.due_at)
        except Exception as exc:  # noqa: BLE001 - 외부 API 실패는 폭넓게 잡아 재시도 대상으로 남김
            print(f"[notifier] 구글 캘린더 알림 실패 (user_id={user.id}): {exc}")
            all_succeeded = False

    return attempted and all_succeeded
