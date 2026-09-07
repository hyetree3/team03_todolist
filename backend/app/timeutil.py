"""시간 관련 공용 유틸. 이 프로젝트는 UTC 대신 한국 시간(KST) 기준으로
created_at/due_at을 다룬다 — DB엔 타임존 정보 없이 KST 벽시계 값 그대로 저장한다."""
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def now_kst() -> datetime:
    """지금 시각을 KST 기준으로 반환한다 (타임존 정보는 안 붙임, naive datetime)."""
    return datetime.now(KST).replace(tzinfo=None)


def period_range(period: str) -> tuple[datetime, datetime]:
    """통계용 기간의 [시작, 끝) 범위를 KST 기준으로 반환한다 (끝은 미포함).

    - today: 오늘 00:00 ~ 내일 00:00
    - week: 이번 주 월요일 00:00 ~ 다음 주 월요일 00:00
    - month: 이번 달 1일 00:00 ~ 다음 달 1일 00:00
    - year: 올해 1월 1일 00:00 ~ 내년 1월 1일 00:00
    """
    today = now_kst().replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "today":
        return today, today + timedelta(days=1)

    if period == "week":
        start = today - timedelta(days=today.isoweekday() - 1)  # 이번 주 월요일
        return start, start + timedelta(days=7)

    if period == "month":
        start = today.replace(day=1)
        next_month = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
        return start, next_month

    if period == "year":
        start = today.replace(month=1, day=1)
        return start, start.replace(year=start.year + 1)

    raise ValueError(f"알 수 없는 period: {period}")
