"""알림 문구 생성.

`E:\\work\\CLAUDE.md` 원본 스펙: "users 테이블 alarm_style 컬럼 ... love / normal / nagging
... 각각 사랑스럽게/평범하게/잔소리 스타일에 맞춰서 문구를 랜덤으로 생성 알람 전송".

2026-09-08 추가: `todos.category`(중요/업무/개인/기타, 한국어 문자열 그대로 들어옴)에 따라
같은 alarm_style 안에서도 문구를 다르게 준다. category가 없거나(None) 저 네 가지 중
하나가 아니면 "기타" 취급한다.
"""
import random

_CATEGORIES = ("중요", "업무", "개인", "기타")
_DEFAULT_CATEGORY = "기타"
_DEFAULT_STYLE = "normal"

# ---------- 마감 1시간 전 알림 ----------
_TEMPLATES: dict[str, dict[str, list[str]]] = {
    "love": {
        "중요": [
            "💕 '{title}' 정말 중요한 일이잖아요! 마감이 1시간 남았어요, 끝까지 잘 챙겨봐요!",
        ],
        "업무": [
            "🥰 '{title}' 업무 마감이 1시간 남았어요. 오늘도 고생 많아요, 조금만 더 힘내요!",
        ],
        "개인": [
            "💖 '{title}' 마감이 1시간 남았어요~ 나를 위한 시간이니까 잊지 말고 챙겨봐요!",
        ],
        "기타": [
            "💕 '{title}' 마감이 1시간 남았어요! 조금만 힘내봐요, 잘 하고 있어요!",
        ],
    },
    "normal": {
        "중요": [
            "❗ [중요] '{title}' 마감이 1시간 남았습니다. 놓치지 않도록 주의하세요.",
        ],
        "업무": [
            "💼 [업무] '{title}' 마감이 1시간 남았습니다.",
        ],
        "개인": [
            "🏠 [개인] '{title}' 마감이 1시간 남았습니다.",
        ],
        "기타": [
            "📌 '{title}' 마감이 1시간 남았습니다.",
        ],
    },
    "nagging": {
        "중요": [
            "🚨 야! '{title}' 이거 중요하다며! 1시간밖에 안 남았는데 왜 아직도 안 끝냈어?!",
        ],
        "업무": [
            "😤 '{title}' 업무 마감 1시간 전이야. 일 좀 미리미리 해, 맨날 이러네.",
        ],
        "개인": [
            "🙄 '{title}' 개인 일정도 이렇게 미루기야? 1시간 남았다, 얼른 해.",
        ],
        "기타": [
            "😑 '{title}' 마감이 1시간 밖에 안 남았어. 이번엔 진짜 늦지 마.",
        ],
    },
}

# ---------- 할일 생성 알림 ----------
_CREATED_TEMPLATES: dict[str, dict[str, list[str]]] = {
    "love": {
        "중요": [
            "💕 '{title}' 중요한 일 등록했네요! 잘 챙길 수 있게 제가 도와드릴게요~",
        ],
        "업무": [
            "🥰 '{title}' 업무 일정 등록 완료! 오늘도 파이팅이에요.",
        ],
        "개인": [
            "💖 '{title}' 등록됐어요~ 나만의 소중한 시간, 잘 챙겨봐요!",
        ],
        "기타": [
            "💕 '{title}' 등록 완료! 마감 다가오면 다시 알려드릴게요~",
        ],
    },
    "normal": {
        "중요": [
            "❗ [중요] '{title}' 할일이 등록되었습니다.",
        ],
        "업무": [
            "💼 [업무] '{title}' 할일이 등록되었습니다.",
        ],
        "개인": [
            "🏠 [개인] '{title}' 할일이 등록되었습니다.",
        ],
        "기타": [
            "📝 '{title}' 할일이 등록되었습니다.",
        ],
    },
    "nagging": {
        "중요": [
            "😤 '{title}' 중요하다며 이제야 등록해? 미루지 말고 미리미리 좀 해.",
        ],
        "업무": [
            "🙄 '{title}' 업무 등록했네. 일 벌써 몇 번째 미루는 거야, 이번엔 제때 해.",
        ],
        "개인": [
            "😤 '{title}' 개인 일정도 이렇게 뒤늦게 등록이야? 계획적으로 좀 살아.",
        ],
        "기타": [
            "😑 '{title}' 등록했다고? 나중에 딴소리하지 말고 꼭 해.",
        ],
    },
}


def _resolve(style: str | None, category: str | None) -> tuple[str, str]:
    resolved_style = style if style in _TEMPLATES else _DEFAULT_STYLE
    resolved_category = category if category in _CATEGORIES else _DEFAULT_CATEGORY
    return resolved_style, resolved_category


def build_message(alarm_style: str | None, title: str, category: str | None = None) -> str:
    """alarm_style(love/normal/nagging) x category(중요/업무/개인/기타)에 맞는
    "마감 임박" 문구를 랜덤으로 골라 title을 채워 반환한다. 모르는 값이거나 비어있으면
    각각 normal/기타로 대체한다."""
    style, cat = _resolve(alarm_style, category)
    templates = _TEMPLATES[style][cat]
    return random.choice(templates).format(title=title)


def build_created_message(alarm_style: str | None, title: str, category: str | None = None) -> str:
    """alarm_style x category에 맞는 "할일 등록됨" 문구를 랜덤으로 골라 title을 채워 반환한다."""
    style, cat = _resolve(alarm_style, category)
    templates = _CREATED_TEMPLATES[style][cat]
    return random.choice(templates).format(title=title)
