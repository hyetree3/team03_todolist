"""할일 알림(Discord DM) + 구글 캘린더 등록.

할일은 오직 backend API(POST /todos)를 통해서만 생성되므로, kakao처럼 별도 프로세스가
DB를 폴링해서 뒤늦게 알아챌 필요 없이 여기서 생성 시점에 바로 처리한다
(app/notification_scheduler.py의 handle_todo_created가 이 함수들을 호출한다)."""
from sqlmodel import Session, select

from app.crypto_utils import decrypt
from app.database import engine
from app.discord_dm import send_dm
from app.google_calendar import create_reminder_event
from app.messages import build_created_message, build_message
from app.models import CalendarEventLog, Todo, User


def send_created_notification(user: User, todo: Todo) -> bool:
    """할일이 막 생성됐을 때 보내는 알림.

    - discord_id가 있으면 "등록됐어요" 스타일 DM 발송.
    - google_refresh_token_encrypted가 있고 마감이 있으면, 지금 바로 캘린더에 일정을
      만든다. **일부러 마감 임박 시점이 아니라 지금 만든다** — 안 그러면 구글 캘린더 자체의
      "60분 전 팝업" 리마인더가 이미 지난 시각으로 설정되는 셈이라 무의미해지기 때문.
      이미 이 할일로 만들어둔 이벤트가 있으면(CalendarEventLog에 기록됨) 다시 만들지
      않는다 — 채널별로 독립적으로 성공 여부를 취급해서, 한쪽(Discord)이 계속 실패해도
      다른 쪽(캘린더)이 재시도 때마다 중복 생성되지 않게 한다.

    최소 한 가지 채널을 시도했고, 시도한 채널이 전부 성공(또는 이미 완료)했을 때만 True를
    반환한다. 연동된 채널이 하나도 없으면 False를 반환해 created_notified를 갱신하지 않는다
    (안전망 스윕에서 다시 시도됨).
    """
    attempted = False
    all_succeeded = True

    if user.discord_id:
        attempted = True
        text = build_created_message(user.alarm_style, todo.title, todo.category)
        ok = send_dm(user.discord_id, text)
        all_succeeded = all_succeeded and ok

    if user.google_refresh_token_encrypted and todo.due_at:
        attempted = True
        with Session(engine) as session:
            already_created = session.exec(
                select(CalendarEventLog).where(CalendarEventLog.todo_id == todo.id)
            ).first()
        if already_created is None:
            try:
                refresh_token = decrypt(user.google_refresh_token_encrypted)
                event_id = create_reminder_event(refresh_token, todo.title, todo.due_at)
                # 나중에 이 할일이 삭제됐을 때 캘린더 이벤트도 같이 지우려면 event_id를
                # 기억해둬야 하는데, Todo 행 자체가 삭제되면 사라지니 별도 로그에 남긴다
                # (app/notification_scheduler.cleanup_calendar_event 참고).
                with Session(engine) as session:
                    session.add(CalendarEventLog(todo_id=todo.id, user_id=user.id, event_id=event_id))
                    session.commit()
            except Exception as exc:  # noqa: BLE001 - 외부 API 실패는 폭넓게 잡아 재시도 대상으로 남김
                print(f"[notifier] 구글 캘린더 일정 생성 실패 (user_id={user.id}): {exc}")
                all_succeeded = False

    return attempted and all_succeeded


def send_due_soon_notification(user: User, todo: Todo) -> bool:
    """마감 1시간 전에 보내는 알림. Discord DM만 보낸다 — 캘린더 일정은
    send_created_notification()에서 생성 시점에 이미 만들어졌어야 한다 (여기서 또 만들면
    중복 이벤트가 생김). discord_id가 없으면 보낼 곳이 없으므로 False를 반환한다."""
    if not user.discord_id:
        return False
    text = build_message(user.alarm_style, todo.title, todo.category)
    return send_dm(user.discord_id, text)
