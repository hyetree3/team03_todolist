"""알림 문구 생성.

`E:\\work\\CLAUDE.md` 원본 스펙: "users 테이블 alarm_style 컬럼 ... love / normal / nagging
... 각각 사랑스럽게/평범하게/잔소리 스타일에 맞춰서 문구를 랜덤으로 생성 알람 전송".
"""
import random

_TEMPLATES: dict[str, list[str]] = {
    "love": [
        "💕 자기야~ '{title}' 마감이 1시간 남았어! 조금만 힘내서 끝내보자, 할 수 있어!",
        "🥰 사랑하는 당신, '{title}' 마감이 코앞이에요. 잊지 말고 챙겨줘요~",
        "💖 1시간 뒤면 '{title}' 마감이야! 끝내고 나면 내가 짱 칭찬해줄게 ❤️",
    ],
    "normal": [
        "⏰ '{title}' 마감이 1시간 남았습니다.",
        "🔔 알림: '{title}' 할일의 마감 시각이 1시간 앞으로 다가왔어요.",
        "📌 '{title}' — 마감까지 1시간 남았습니다. 확인해주세요.",
    ],
    "nagging": [
        "😤 야! '{title}' 마감 1시간 남았는데 아직도 안 했어?! 얼른 해!",
        "🙄 또 미루고 있는 거 아니지? '{title}' 마감 1시간 전이다, 지금 당장 시작해.",
        "😑 '{title}' 마감이 1시간 밖에 안 남았어. 이번엔 진짜 늦지 마.",
    ],
}

_DEFAULT_STYLE = "normal"


def build_message(alarm_style: str | None, title: str) -> str:
    """alarm_style(love/normal/nagging)에 맞는 문구를 랜덤으로 골라 title을 채워 반환한다.
    모르는 값이거나 비어있으면 normal 스타일로 대체한다."""
    templates = _TEMPLATES.get(alarm_style or _DEFAULT_STYLE, _TEMPLATES[_DEFAULT_STYLE])
    return random.choice(templates).format(title=title)
