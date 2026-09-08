"""시간 관련 공용 유틸. backend/app/timeutil.py와 동일한 규칙(KST naive datetime)을
따르도록 맞춘 복사본이다 — kakao는 backend 폴더를 import하지 않는 독립 모듈이라 직접
복사해서 유지한다. backend 쪽 규칙이 바뀌면 이 파일도 같이 맞춰야 한다.

due_at을 UTC로 잘못 다루면 "마감 1시간 전"이 실제로는 KST와 9시간 어긋난 시각에
발송되는 심각한 버그가 되므로, kakao 쪽 모든 시간 비교는 반드시 이 모듈을 통해야 한다.
"""
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def now_kst() -> datetime:
    """지금 시각을 KST 기준으로 반환한다 (타임존 정보는 안 붙임, naive datetime)."""
    return datetime.now(KST).replace(tzinfo=None)
