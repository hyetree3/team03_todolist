from crypto_utils import decrypt
from discord_bot import send_dm
from google_calendar import create_reminder_event
from messages import build_created_message, build_message
from models import Todo, User


async def send_created_notification(user: User, todo: Todo) -> bool:
    """할일이 막 생성됐을 때 보내는 알림 (scheduler.check_and_notify()의 created_notified
    체크에서 호출됨).

    - discord_id가 있으면 "등록됐어요" 스타일 DM 발송 (messages.build_created_message).
    - google_refresh_token_encrypted가 있고 마감이 있으면, 지금 바로 캘린더에 일정을
      만든다. **일부러 마감 임박 시점이 아니라 지금 만든다** — 안 그러면 구글 캘린더 자체의
      "60분 전 팝업" 리마인더가 이미 지난 시각으로 설정되는 셈이라 무의미해지기 때문.

    최소 한 가지 채널을 시도했고, 시도한 채널이 전부 성공했을 때만 True를 반환한다.
    연동된 채널이 하나도 없으면 False를 반환해 created_notified를 갱신하지 않는다
    (다음 스케줄러 주기에 다시 시도됨).
    """
    attempted = False
    all_succeeded = True

    if user.discord_id:
        attempted = True
        text = build_created_message(user.alarm_style, todo.title)
        ok = await send_dm(user.discord_id, text)
        all_succeeded = all_succeeded and ok

    if user.google_refresh_token_encrypted and todo.due_at:
        attempted = True
        try:
            refresh_token = decrypt(user.google_refresh_token_encrypted)
            create_reminder_event(refresh_token, todo.title, todo.due_at)
        except Exception as exc:  # noqa: BLE001 - 외부 API 실패는 폭넓게 잡아 재시도 대상으로 남김
            print(f"[notifier] 구글 캘린더 일정 생성 실패 (user_id={user.id}): {exc}")
            all_succeeded = False

    return attempted and all_succeeded


async def send_due_soon_notification(user: User, todo: Todo) -> bool:
    """마감 1시간 전에 보내는 알림 (scheduler.check_and_notify()의 notified 체크에서 호출됨).

    Discord DM만 보낸다 — 캘린더 일정은 send_created_notification()에서 생성 시점에
    이미 만들어졌어야 한다 (여기서 또 만들면 중복 이벤트가 생김).
    discord_id가 없으면 보낼 곳이 없으므로 False를 반환한다.
    """
    if not user.discord_id:
        return False
    text = build_message(user.alarm_style, todo.title)
    return await send_dm(user.discord_id, text)
