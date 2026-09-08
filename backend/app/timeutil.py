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


def previous_period_range(period: str, start: datetime, end: datetime) -> tuple[datetime, datetime]:
    """지난 기간 대비 증감율 계산용 — 지금 기간과 길이가 같은 "바로 직전 기간"의
    [시작, 끝)을 반환한다. month/year는 길이가 매번 달라서(28~31일, 윤년) 그냥 날짜
    빼기로는 안 되고 달력 기준으로 한 달/한 해를 통째로 밀어야 한다."""
    if period == "month":
        if start.month == 1:
            prev_start = start.replace(year=start.year - 1, month=12)
        else:
            prev_start = start.replace(month=start.month - 1)
        return prev_start, start

    if period == "year":
        return start.replace(year=start.year - 1), start

    # today/week는 길이가 고정이라 그만큼 그대로 뒤로 밀면 된다.
    length = end - start
    return start - length, start


WEEKDAY_KR = ["월", "화", "수", "목", "금", "토", "일"]  # date.weekday(): 0=월 ~ 6=일
