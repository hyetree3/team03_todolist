"""알림 문구 생성.

`E:\\work\\CLAUDE.md` 원본 스펙: "users 테이블 alarm_style 컬럼 ... love / normal / nagging
... 각각 사랑스럽게/평범하게/잔소리 스타일에 맞춰서 문구를 랜덤으로 생성 알람 전송".
"""
import random

_TEMPLATES: dict[str, list[str]] = {
    "love": [
        "💕 '{title}' 마감이 1시간 남았어요! 조금만 힘내봐요, 잘 하고 있어요!",
        "🥰 '{title}' 마감이 코앞으로 다가왔어요~ 잊지 말고 꼭 챙겨주세요!",
        "💖 1시간 뒤면 '{title}' 마감이에요! 다 끝내고 나면 스스로 꼭 칭찬해주세요 ❤️",
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

_CREATED_TEMPLATES: dict[str, list[str]] = {
    "love": [
        "💕 '{title}' 등록 완료! 마감 다가오면 다시 알려드릴게요~",
        "🥰 '{title}' 잘 등록됐어요! 이따 마감 1시간 전에 다시 챙겨드릴게요.",
    ],
    "normal": [
        "📝 '{title}' 할일이 등록되었습니다.",
        "✅ 알림: '{title}'이(가) 새로 등록됐어요.",
    ],
    "nagging": [
        "😤 '{title}' 등록했다고? 나중에 딴소리하지 말고 꼭 해.",
        "🙄 '{title}' 추가했네. 마감 코앞에서 허둥대지 말고 미리미리 해.",
    ],
}

_DEFAULT_STYLE = "normal"


def build_message(alarm_style: str | None, title: str) -> str:
    """alarm_style(love/normal/nagging)에 맞는 "마감 임박" 문구를 랜덤으로 골라
    title을 채워 반환한다. 모르는 값이거나 비어있으면 normal 스타일로 대체한다."""
    templates = _TEMPLATES.get(alarm_style or _DEFAULT_STYLE, _TEMPLATES[_DEFAULT_STYLE])
    return random.choice(templates).format(title=title)


def build_created_message(alarm_style: str | None, title: str) -> str:
    """alarm_style에 맞는 "할일 등록됨" 문구를 랜덤으로 골라 title을 채워 반환한다."""
    templates = _CREATED_TEMPLATES.get(alarm_style or _DEFAULT_STYLE, _CREATED_TEMPLATES[_DEFAULT_STYLE])
    return random.choice(templates).format(title=title)
