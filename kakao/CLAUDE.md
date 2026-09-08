# kakao 파트 — Claude Code 내부 작업 지침

이 파일은 사람이 아니라 **다음에 이 폴더를 작업할 Claude Code 세션**을 위한 내부 메모다.
git에는 올리지 않는다(`.gitignore`에 포함, backend 팀도 동일 패턴 사용). 사람에게 보여줄
사용법/연동 안내는 `README.md`를 봐라.

## 원본 스펙

`E:\work\CLAUD.MD` (저장소 밖, 팀 전체 스펙 문서). 요약:
- TODO LIST 알림 서비스. 역할 분담: 1.프론트(민서/React) 2.백엔드+DB(혜림/FastAPI+SQLite)
  **3.Discord 봇 + Google Calendar 연동(재원, 이 폴더 담당)**.
- **"1번 2번은 절대 건들이면 안됨"** — `backend/`, `frontend/` 폴더의 파일을 직접 수정/삭제하지 말 것.
  통합이 필요하면 코드를 직접 고치지 말고 사람에게 요청/질문할 것.
- CLAUD.md 자체 운영 규칙: 대화는 한국어로, 애매하면 질문, 파일 삭제/수정 전 허가 필요,
  대화 로그를 `E:\work`에 남길 것(`E:\work\kakao_session_log.md`에 계속 기록 중).

## 지금까지 확정된 설계 결정 (재질문하지 말 것)

1. **DB**: 지금은 `kakao/app.db`에 SQLModel로 `users`/`todos`를 독립적으로 만들어 테스트.
   실제 통합 시엔 `main.py`(스케줄러+봇)는 backend와 별개 프로세스로 두고 `DATABASE_URL`만
   backend의 실제 DB 파일로 맞추면 됨 — 아래 "남은 통합 이슈" A) 참고.
2. **Google/Discord OAuth 라우터**: **2026-09-08 backend로 이식 완료.** 코드는 이제
   `kakao/routers/`가 아니라 `backend/app/routers/google_auth.py`,
   `backend/app/routers/discord_auth.py`에 있고, `backend/main.py`에 `include_router`로
   마운트되어 실제로 backend FastAPI 프로세스(포트 8000) 안에서 돈다. kakao 폴더에는 이제
   이 두 라우터 파일이 없음 — 다음 세션이 다시 만들지 말 것, backend 쪽을 볼 것.
3. **Discord 계정 연동 — 2026-09-08 업데이트**: 처음엔 "회원가입 폼에서 `discord_id`(숫자 ID)를
   직접 입력받는 방식"으로 결정했었는데(백엔드에 이미 필드는 구현되어 있음), 실제로 테스트해보니
   일반 사용자가 숫자 ID를 직접 찾아 입력하는 건(개발자 모드 켜고 우클릭 → 복사) 너무 번거롭다는
   걸 확인함. 그래서 **OAuth 방식으로 전환**: `discord_oauth.py` + `routers/discord_auth.py`를
   추가해서, 회원가입/설정 화면의 "Discord 연동" 버튼 → Discord 인증 페이지로 리다이렉트 →
   사용자가 권한 수락만 하면 → 콜백에서 자동으로 숫자 ID를 알아내 `discord_id`에 저장한다
   (google_calendar.py의 OAuth 플로우와 완전히 같은 패턴). **실제 계정으로 전체 흐름을
   끝까지 테스트해서 성공 확인함** (아래 "검증된 것" 참고). 회원가입 폼에 숫자 ID를 직접
   입력받는 옛 방식은 더 이상 권장하지 않음 — 프론트 쪽에 "Discord 연동" 버튼 방식으로
   바꿔달라고 요청할지는 사용자와 상의 필요 (프론트/백엔드 파일은 직접 안 건드림).
4. **Discord 서버 여부**: 전용 서버를 만들지 않고 **User-Installable App**(개인 계정에 앱 설치)
   방식으로 진행. `discord_bot.py`의 `/start` 슬래시 커맨드가 그 최초 접점 역할을 함.
   이 방식이 예약 발송(DM)까지 안정적으로 허용하는지는 Discord 쪽 문서로 100% 보장되지 않아서
   실제 테스트 필요 (README의 "검증 필요 사항" 참고). 안 되면 서버 방식으로 되돌려야 함.

## ✅ 2026-09-08: 스케줄러 경쟁 이슈 해결됨 (더 이상 재질문하지 말 것)

이전에 "핵심 미해결 질문"이었던 **kakao 스케줄러 vs backend 스케줄러 중복 문제**가
혜림님 쪽에서 정리됨을 `backend/main.py` 코드로 확인함:

```python
# backend/main.py 발췌
# 마감 임박 개인 알림(디스코드 DM/구글 캘린더)은 kakao 모듈이 전담하기로 결정함.
# backend 스케줄러(app/scheduler.py)까지 같이 켜두면 같은 todos.notified 플래그를
# 두 스케줄러가 동시에 갱신하려고 경쟁해서 중복/누락 발송이 생기므로 여기선 껐다.
# from app.scheduler import start_scheduler   ← import/호출 모두 주석 처리됨
```

→ 위 선택지 중 **1번(kakao가 유일한 스케줄러)** 으로 확정됨. `backend/app/scheduler.py`와
`backend/app/notifications.py`는 참고용으로만 코드가 남아있고 실행되지 않는다.
**kakao의 `scheduler.py`가 개인 알림(Discord DM + Google Calendar)의 유일한 발송 주체다.**
이 전제가 다시 바뀌었는지(예: backend가 `start_scheduler()`를 다시 켰는지)는 매 세션
시작 시 `backend/main.py`를 한 번 확인해서 검증할 것.

## ✅ 2026-09-08 추가: 알림 발송 로직 자체를 backend로 이식 — 이 폴더의 스케줄러는 이제 안 켜짐

사용자가 "할일은 프론트엔드(→backend API)에서만 생성되고, 다른 데서 생성될 일은 거의 없다"고
확인해줘서, "생성 시 알림/캘린더"·"마감 1시간 전 알림"을 이 폴더의 `scheduler.py`가 DB를
폴링해서 뒤늦게 알아채는 방식에서, **backend가 할일을 만들고/고치고/지우는 바로 그 순간
직접 처리**하는 방식으로 바꿨다:
- `backend/app/discord_dm.py`: discord.py 게이트웨이 연결 없이, 봇 토큰으로 Discord REST
  API(`/users/@me/channels` → `/channels/{id}/messages`)를 직접 호출해서 DM을 보낸다. 봇이
  이미 사용자 계정에 설치돼 있으면(OAuth 연동 시 `applications.commands`로 설치됨) 게이트웨이
  접속 없이도 DM 발송이 가능하다는 점을 이용함 — 이 폴더의 `discord_bot.py`(discord.py
  Client)는 더 이상 DM 발송에 쓰이지 않는다.
- `backend/app/messages.py`, `backend/app/notifier.py`: 이 폴더의 `messages.py`/`notifier.py`를
  그대로 이식(문구/로직 동일, discord.py 호출부만 REST로 교체).
- `backend/app/notification_scheduler.py`: 이 폴더의 `scheduler.py`와 같은 역할(정확한 "마감
  1시간 전" 1회성 예약, 5분 안전망 스윕, 삭제된 할일의 캘린더 이벤트 정리)을 하되, backend가
  생성/삭제 시점을 정확히 알고 있으므로 즉시 처리하고 폴링은 안전망으로만 돈다.
  `backend/app/routers/todos.py`의 `create_todo`/`update_todo`/`delete_todo`가
  `BackgroundTasks`로 이걸 호출한다.
- **`kakao/main.py`에서 `scheduler.start_scheduler()` 호출을 제거함** — 이 프로세스는 이제
  `/start` 슬래시커맨드(게이트웨이 연결 필요, 앱 설치 보조 접점)용으로만 선택적으로 띄우면
  되고, 알림 발송에는 더 이상 필요 없다. **다음 세션은 이 폴더의 `scheduler.py`를 다시
  `main.py`에 연결하지 말 것** — backend와 동시에 두 스케줄러가 돌면 예전에 겪었던
  "누가 알림을 담당하냐" 경쟁 문제가 재발한다.
- 이 폴더의 `scheduler.py`/`notifier.py`/`messages.py`/`discord_bot.py`/`google_calendar.py`/
  `crypto_utils.py`/`db.py`/`models.py` 자체는 참고/백업용으로 그대로 남겨뒀다(삭제 안 함).

## ✅ 통합 완료 (2026-09-08) — 더 이상 "남은 통합 이슈" 아님

과거엔 아래 A)/B) 두 갈래가 "남은 통합 이슈"였는데, 사용자가 "3개 폴더를 하나의 사이트로
구성해달라"고 명시적으로 요청해서 이 세션(E:\test 사본 기준)에서 실제로 통합을 완료함:

- **A) 알림 엔진(`main.py`: 스케줄러+봇+캘린더)은 backend와 별개 프로세스로 계속 둔다.**
  → 완료. `kakao/.env`의 `DATABASE_URL`을 `sqlite:///E:/test/backend/app.db`(backend가
  실제 쓰는 파일)로 맞춰뒀다. 두 프로세스가 같은 SQLite 파일을 동시에 열어도 문제없음을
  전제로 한 설계 그대로.
- **B) OAuth 라우터 2개(`routers/google_auth.py`, `routers/discord_auth.py`)는 backend의
  FastAPI 프로세스 안에서 돌아야 한다** → 완료. `backend/app/routers/google_auth.py`,
  `backend/app/routers/discord_auth.py`로 실제 이동했고, `from db import get_session` →
  `from app.database import engine` + `Session(engine)`, `from models import User` →
  `from app.models import User`로 고쳤다. `crypto_utils.py`/`google_calendar.py`/
  `discord_oauth.py`도 `backend/app/`로 같이 옮겼다(kakao 폴더에도 원본은 그대로 남아있음 —
  notifier.py/scheduler.py가 계속 쓰기 때문). kakao 폴더의 라우터 파일 2개는 삭제함(중복
  방지). **이 작업은 backend 파일을 고치는 것이라 원래 "사람에게 요청/허락 필요" 규칙
  대상이었는데, 사용자가 이 세션에서 직접 통합을 명시적으로 지시했으므로 그 지시를 명시적
  허락으로 보고 진행함.**
- 추가로 `/login` 엔드포인트가 원래 쿼리파라미터 `user_id`를 그대로 신뢰하던 걸, 로그인
  토큰(Authorization 헤더, `get_current_user`)으로 검증하도록 보안 보강함 — 안 그러면 다른
  사람의 user_id를 넣어 계정을 가로챌 수 있었음.
- 콜백 성공/실패 응답을 JSON 대신 프론트(`FRONTEND_BASE_URL` 기본값
  `http://localhost:5173/settings?connected=...&status=...`)로 리다이렉트하게 바꿈 — 예전에
  "다른 논의 사항"에 있던 A/B안 중 B안(페이지 리다이렉트)으로 확정.
- **git 관련**: 이 통합은 아직 커밋되지 않았다. 사용자가 "통합이 다 끝난 다음에 내가 브랜치에
  따로 커밋할게"라고 명시했으므로, 이 kakao 세션(또는 backend 세션)에서 git init/commit/push를
  임의로 하지 않았다.
- **회원가입 검증 관련**: backend의 `UserCreate`는 이미 아이디/비번만 받도록 단순화되어 있어서
  (이전에 우려했던 "가입 시 email/discord_id 필수" 문제 없음), 이 부분은 재검토 불필요.

## 이 폴더의 사고(事故) 이력 — 같은 실수 반복 방지

2026-09-07: 이 폴더의 `.py`/`.md`/`env.example` 등 **git에 커밋되지 않은(untracked) 파일들이
브랜치 전환 중 `git clean`으로 추정되는 작업에 의해 통째로 삭제**된 적이 있음 (`.env`, `.venv`는
gitignore 대상이라 살아남음). 커밋 안 된 작업은 브랜치를 전환하거나 정리 명령을 쓰는 순간
git이 전혀 보호해주지 못한다. **이 폴더에서 의미 있는 진전이 생기면, 사용자에게 물어보고
가능한 한 빨리 로컬 커밋을 해둘 것을 적극적으로 제안할 것** (원격 push는 별개로 항상 확인받기).

## 파일 구조

```
kakao/
├── .env                  # 실제 시크릿 (gitignore 대상)
├── .gitignore             # 이 폴더 전용 (.env, app.db, CLAUDE.md 등 제외)
├── env.example            # 값 비운 템플릿 (git 추적됨)
├── requirements.txt
├── README.md               # 사람(팀원)용 안내 — 실행법, 통합 요청사항, Discord 설정법
├── CLAUDE.md                # 이 파일
├── models.py                # SQLModel User/Todo (독립 정의, 2026-09-08 기준 backend와 컬럼 동일)
├── timeutil.py               # now_kst() — backend/app/timeutil.py를 그대로 복사한 버전
├── messages.py                 # alarm_style(love/normal/nagging)별 랜덤 알림 문구
├── db.py                        # engine, create_db_and_tables(), get_session()
├── crypto_utils.py               # Fernet 암복호화 (ENCRYPTION_KEY)
├── discord_bot.py                 # User-Install 봇, /start 커맨드, send_dm()
├── discord_oauth.py                 # Discord OAuth 플로우 (identify + applications.commands)
├── google_calendar.py                 # OAuth 플로우 + 캘린더 이벤트 생성 (Asia/Seoul 명시)
├── routers/google_auth.py              # FastAPI 라우터 (마운트 안 된 상태, 코드만)
├── routers/discord_auth.py              # FastAPI 라우터 (마운트 안 된 상태, 코드만)
├── notifier.py                          # send_notification(user, todo) — discord+구글 분기
├── scheduler.py                          # APScheduler, check_and_notify() (KST 기준)
└── main.py                                # 진입점 (DB 생성 + 스케줄러 + 봇 실행)
```

## 검증된 것

- `.venv`(파이썬 3.14) 기준 모든 모듈 import 성공 (`audioop-lts` 패키지가 Python 3.13+에서
  discord.py 구동에 필요해서 requirements.txt에 조건부로 추가되어 있음, 빠뜨리지 말 것).
- `scheduler.check_and_notify()` 로직을 가짜 데이터 + `discord_bot.send_dm` 모킹으로
  시뮬레이션 테스트 통과 (연동 없는 유저는 알림 안 감, discord 연동 유저는 발송+notified 갱신,
  마감 지난/너무 먼 할일은 대상에서 제외됨을 확인).
- 2026-09-08: `models.py`/`scheduler.py`가 `datetime.utcnow()`를 쓰고 있던 버그를 발견해
  `timeutil.now_kst()`로 전부 교체함. backend는 `due_at`을 KST naive datetime으로 저장하는데
  (`backend/app/timeutil.py`), kakao가 UTC로 비교하고 있어서 그대로 뒀으면 알림이 실제 마감
  9시간 전에 발송되는 심각한 버그였음. 같은 이유로 `google_calendar.py`의 이벤트 생성 시각에도
  `timeZone: "Asia/Seoul"`을 명시하도록 고침 (naive datetime을 offset 없이 보내면 Google이
  UTC로 오인함).
- 2026-09-08: `alarm_style`(love/normal/nagging)에 따라 다른 문구를 랜덤 발송하는 기능
  (`messages.py`)을 추가함 — 원본 스펙(`E:\work\CLAUDE.md`)에 있었지만 이전 세션까지 구현이
  안 되어 있던 부분. `notifier.py`가 이제 `user.alarm_style`을 보고 문구를 고른다.
- 2026-09-08: **실제 Discord 계정으로 전체 흐름 끝까지 테스트 완료**:
  1. 실제 `DISCORD_BOT_TOKEN`으로 게이트웨이 로그인 성공 (`todolist#5786`).
  2. 실제 계정으로 Developer Portal에서 "사용자 설치" 링크로 앱 설치 → 친구 DM 채널에서
     `/start` 실행 → 활성화 메시지 정상 수신 확인.
  3. `/start` 이후, **봇이 먼저 여는 DM**(`send_dm()`을 스케줄러 없이 직접 호출, 예약 발송과
     동일한 상황 재현)이 실제로 도착함을 확인 — kakao/CLAUDE.md·README에 "검증 필요"로 남아있던
     User-Install 방식의 최대 리스크가 해소됨.
  4. `discord_oauth.py` + `routers/discord_auth.py`(신규)로 "Discord 연동" OAuth 플로우 구현.
     임시 FastAPI 테스트 서버(`uvicorn`, 포트 8000)를 띄우고 실제 계정으로
     `/auth/discord/login?user_id=1` → Discord 인증 페이지 → 권한 수락 →
     `/auth/discord/callback` 까지 끝까지 실행 → DB의 `discord_id`가 실제 숫자 ID와 정확히
     일치하게 자동 저장되는 것 확인. **인증 URL에 `integration_type=1`을 반드시 넣어야
     "서버에 추가할지" 되묻는 화면이 안 뜬다** (처음엔 빠뜨려서 헷갈렸음, 지금 코드엔 반영됨).
  - **✅ 2026-09-08 추가 검증**: 실제 계정에서 앱을 완전히 제거(연동 해제)한 뒤, `/start`는
    한 번도 실행하지 않고 **OAuth 연동만** 다시 진행 → 그 상태로 `send_dm()` 호출 →
    DM 정상 도착 확인. 즉 **`/start` 커맨드는 더 이상 필수가 아니다** — OAuth 연동
    (`applications.commands` 스코프 포함)만으로 설치와 DM 접점이 모두 해결된다.
    `discord_bot.py`의 `/start` 커맨드 자체는 남겨둬도 무방하지만(핸드폰으로 링크만 눌러
    설치가 애매한 사용자를 위한 백업 경로 정도), 온보딩 안내에서 필수 단계로 요구할 필요는
    없다.
- 2026-09-08: **Google Calendar OAuth도 실제 계정으로 끝까지 테스트 완료**:
  1. 임시 FastAPI 테스트 서버로 `routers/google_auth.py`를 마운트, `/auth/google/login?user_id=1`
     → Google 로그인 화면 → 권한 수락 → `/auth/google/callback` 성공,
     DB의 `google_refresh_token_encrypted`에 암호화된 토큰이 저장되는 것 확인.
  2. 저장된 토큰을 `crypto_utils.decrypt()`로 복호화 → `google_calendar.create_reminder_event()`
     직접 호출 → 실제 Google Calendar에 이벤트가 생성되고, 사용자가 실제로 캘린더에서
     확인함. `timeZone: "Asia/Seoul"` 수정이 제대로 반영되어 시각도 정확했음.
  3. 과정에서 겪은 두 가지 에러(둘 다 코드 문제 아니라 Google Cloud Console 설정 문제였음,
     다음에 또 겪을 수 있어 기록):
     - `redirect_uri_mismatch`: "승인된 자바스크립트 원본"과 "승인된 리디렉션 URI"를
       헷갈려서 처음엔 잘못된 칸에 등록함. 또, 올바른 칸에 등록해도 Google이 명시하듯
       **반영까지 5분~몇 시간 걸릴 수 있음** — 설정이 맞다면 에러가 나도 잠시 기다렸다가
       재시도해볼 것.
     - `403 access_denied` ("Google 인증 절차를 완료하지 않음"): OAuth 동의 화면이
       "테스트" 상태라 사전에 등록한 테스터 계정만 로그인 가능. Google Cloud Console →
       OAuth 동의 화면 → 테스트 사용자에 이메일을 추가해야 함 (최대 100명). 이 프로젝트
       규모에서는 프로덕션 게시(Google 검토 필요)까지 갈 필요 없음 — README에 팀 공유용
       설명 추가함.
- 2026-09-08: **"할일 생성 시 알림" 기능 추가**. 원본 스펙이 "생성 시 + 마감 1시간 전" 둘 다
  요구했는데 그동안 후자만 있었음. `models.py`에 `created_notified` 컬럼(kakao 전용, backend
  스키마엔 아직 없음 — README "요청해야 하는 것" 7번 참고) 추가, `messages.py`에
  `build_created_message()`(스타일별 "등록됨" 문구) 추가, `notifier.py`를
  `send_created_notification()`/`send_due_soon_notification()` 두 함수로 분리
  (전자만 캘린더 이벤트 생성 — 생성 시점에 바로 만들어야 구글 자체 60분 전 팝업이 의미
  있음), `scheduler.check_and_notify()`에 생성 알림 체크 루프 추가. 가짜 유저/할일로
  시뮬레이션 테스트 통과 (마감이 먼 할일=생성 알림만, 마감 임박 할일=생성+임박 둘 다,
  캘린더는 한 번만 생성됨을 확인).
  - **로컬 DB 마이그레이션 주의**: 기존에 이미 만들어져 있던 `kakao/app.db`는 `create_all()`이
    기존 테이블에 컬럼을 추가해주지 않아서 `created_notified` 컬럼이 없는 채로 남아있었음.
    실제 데이터가 있는 로컬 DB로 테스트할 땐 `ALTER TABLE todos ADD COLUMN created_notified
    BOOLEAN DEFAULT 0`을 수동으로 한 번 실행해줘야 함 (새 DB는 상관없음, `create_all()`이
    알아서 만들어줌).
  - 사용자 피드백으로 "love" 스타일 문구를 한 번 더 수정함: 처음에 "자기야", "사랑하는 당신"
    같은 연인 호칭을 썼는데, "사랑스럽게"는 연인처럼이 아니라 다정한 톤을 뜻한다는 지적을
    받고 호칭 없이 다정한 응원 톤으로 고침. 다음에 이 문구를 또 손볼 일이 있으면 연인
    호칭(자기야류)은 쓰지 말 것.
  - 실제 계정 + 실제 봇으로 style 3종(normal/love/nagging)을 순서대로 바꿔가며 테스트용
    할일 3개("수업"/"발표"/"과제", 전부 오늘 11:00 마감)를 생성해서 생성 알림까지 확인함.
    마감 임박 알림은 `alarm_style`이 **계정 전체 설정**이라, 마지막으로 바꾼 스타일
    (nagging)로 셋 다 한꺼번에 나갈 예정 — 이건 사용자에게도 미리 안내함.
    실제로 10시가 되자 세 개 다 nagging 스타일로 정상 발송됨을 확인 (다만 이때는 아직
    폴링 방식이라, 정확히 10:00이 아니라 다음 폴링 시각(약 10:01, 사용자가 "왜 안 오냐"고
    물어본 시점)에 나갔음 — 이게 바로 아래 정밀 예약 개선의 계기가 됨).

- 2026-09-08: **"마감 1시간 전" 알림을 정확한 시각에 보내도록 개선**. 사용자가 "정확히
  1시간전에 오게 하고싶은데 방법 없어?"라고 요청 → 기존 5분 폴링 방식(최대 5분 지연 가능)
  대신, 할일마다 APScheduler `date` 트리거로 "마감-1시간" 정각에 1회성 잡을 예약하는
  방식(`scheduler.schedule_due_soon()`, `_fire_due_soon()`, `_schedule_all_pending_due_soon()`)
  으로 바꿈. 기존 5분 폴링(`check_and_notify`)은 안전망으로 유지 (정밀 예약이 어떤 이유로든
  안 걸렸을 때만 작동). 가짜 데이터로 시뮬레이션 테스트: 마감 임박(1시간 안 남음) 할일은
  즉시 실행 경로로, 마감이 먼 할일은 `due_at - 1시간` 정각에 정확히 잡이 등록되는 것 확인 —
  둘 다 통과. 실제 봇으로도 재시작해서 정상 동작 확인.
  - **한계 솔직히 기록**: 이 예약은 메모리에만 있어서 봇 재시작 시 사라지지만, 재시작될 때
    `_schedule_all_pending_due_soon()`이 대기 중인 할일 전부를 다시 정확하게 재예약하므로
    문제없음. 진짜 정밀도가 깨지는 유일한 경우는 "할일 생성~마감 1시간 전 사이에 봇이 계속
    꺼져있다가, 그 정확한 시각을 이미 지난 뒤에야 재시작되는" 극단적인 경우뿐 — 이땐 5분
    폴링이 최후의 보루로 뒤늦게라도 발송함. 이 트레이드오프는 사용자에게도 설명함
    (지속적으로 `python main.py`를 켜두는 걸 전제로 한 설계).

## 다른 논의 사항 (코드 변경 없음, 참고용)

- **프론트엔드 "연동 중" UI 관련 아이디어 논의**: 사용자가 "연동 버튼 누르면 연동중이라고
  뜨게 하고 싶은데 아이디어 있어?"라고 질문 → 두 가지 제시함: A) 팝업 창 + postMessage
  방식(더 매끄러운 UX, 콜백이 JSON 대신 작은 HTML 반환하고 opener에 메시지 보낸 뒤 자동
  닫힘), B) 페이지 전체 리다이렉트 + 콜백이 프론트 주소로 다시 리다이렉트(쿼리 파라미터로
  성공/실패 전달, 더 간단함). 사용자가 아직 최종 선택 안 함 — 다음에 정해지면 그에 맞게
  `routers/discord_auth.py`/`routers/google_auth.py`의 콜백 응답 형식을 바꿔줘야 함
  (지금은 그냥 JSON 반환).
- **"연동 여부" 체크 방법 논의**: Discord는 `discord_id`가 null인지로 체크하기로 팀에서
  확정함 (이미 `UserRead`에 노출되어 있어 추가 작업 불필요, `discord_id`는 자격증명이
  아니라 식별자라 노출해도 안전하다고 설명함). Google은 `google_refresh_token_encrypted`가
  실제 자격증명(진짜 토큰)이라 API로 노출하면 안 되고, 대신 `google_calendar_linked: bool`
  같은 필드를 `UserRead`에 새로 추가해달라고 backend에 요청해야 한다고 안내함 — 사용자가
  "캘린더 알람"이라는 이름으로 컬럼을 추가할 예정이라고 알려옴 → **아래 항목에서 실제로
  반영된 것을 확인함.**

## 2026-09-08: backend 스키마 대규모 변경 반영 (git 커밋 분리 작업 중 발견)

`discord test` 커밋에 backend의 미커밋 변경사항이 같이 섞여 들어간 걸 분리하려다가,
그 사이 backend에 워킹트리 상태로 쌓여있던(아직 커밋 안 된) 새 변경사항들을 발견해서
kakao 쪽을 거기 맞춰 업데이트함:

- **`calender_alarm: bool`** 필드가 `User`에 실제로 추가됨 (철자 그대로 "calender", "calendar"
  아님 — 실수 아니고 backend 실제 필드명이니 kakao/프론트 다 이 철자로 맞춰야 함). 이게
  바로 위에서 요청했던 "구글 연동 여부 boolean"임. `kakao/models.py`에도 똑같이 추가하고,
  `routers/google_auth.py`의 콜백이 `google_refresh_token_encrypted` 저장할 때 같이
  `calender_alarm = True`로 갱신하도록 고침 (알림 발송 판단 자체는 여전히
  `google_refresh_token_encrypted` 존재 여부로 함 — `calender_alarm`은 프론트 표시 전용).
- **회원가입이 아이디/비번만 받도록 단순화됨**, `email`/`discord_id`/`alarm_style`은
  가입 후 `PATCH /users/me`(`UserSettingsUpdate`)로 설정. 이 kakao 파트가 요청했던
  "가입 시 필수 검증 재검토"가 정확히 이 방향으로 해결됨. kakao 쪽 코드 변경은 필요
  없음(OAuth 콜백은 이미 user_id로 직접 DB를 갱신하는 방식이라 영향 없음).
- **`User.point` 제거됨**, 날짜별 `PointLog` 테이블(+ `backend/app/point_scheduler.py`,
  매일 자정 KST에 그날의 기본 행 생성)로 대체됨 — 나무/캐릭터 성장 기능용, kakao 알림
  로직과는 무관. kakao의 `models.py`에서도 `point` 필드를 그냥 삭제함 (원래도 안 쓰던 필드).
  이 새 `point_scheduler.py`는 `backend/main.py`의 `start_point_scheduler()`로 시작되는데,
  기존에 꺼져있던 개인 알림용 `app/scheduler.py`(`start_scheduler`)와는 **완전히 다른
  스케줄러**라 이전에 확정한 "개인 알림은 kakao가 전담" 합의와 충돌 없음 — 매 세션마다
  `backend/main.py`를 확인할 때 이 둘을 헷갈리지 말 것.
- 로컬 테스트 DB(`kakao/app.db`)에 `ALTER TABLE users ADD COLUMN calender_alarm BOOLEAN
  DEFAULT 0`으로 컬럼 추가하고, 이미 구글 연동돼 있던 테스트 유저(id=1)의 `calender_alarm`을
  `True`로 백필함. 전체 모듈 import 재검증 통과.
- README의 "요청해야 하는 것" 6/8번을 "해결됨"으로 갱신함.

## 2026-09-08: 봇 재시작 지연 버그 발견/수정 + "할일 삭제 시 캘린더 이벤트 자동 삭제" 추가

- **버그 발견 경위**: 테스트로 "수업"(12:00) 할일을 만들고 바로 봇을 재시작했는데,
  DB 확인해보니 `notified=True`인데 `created_notified=False`인 이상한 상태가 나옴.
  원인 분석: `_schedule_all_pending_due_soon()`은 재시작 시 즉시 실행돼서 "마감 임박"은
  바로 처리되는데, "생성 알림"(+캘린더 등록)은 그때까지 5분 주기 스캔에서만 처리되고
  있어서, 디버깅하며 봇을 여러 번 재시작하는 동안 그 5분 스캔이 한 번도 돌 기회를
  못 잡고 계속 밀림. → `start_scheduler()`에 `check_and_notify`를 `date` 트리거로
  즉시 1회 실행하는 잡(`startup_immediate_check`)을 추가해서 해결. 재현 테스트로 확인함
  (재시작 직후 `created_notified`가 바로 `True`로 바뀌는 것 확인).
- 이 디버깅 과정에서 실제 캘린더에 테스트 이벤트가 여러 개 쌓임 → 사용자가 "구글
  캘린더는 왜 전혀 삭제가 안됐는데"라고 지적 → 확인해보니 **애초에 "할일 삭제 시 캘린더
  이벤트도 같이 지우는" 기능 자체가 없었음** (create만 있고 delete가 없었음, event_id도
  어디 저장 안 해서 나중에 찾을 방법도 없었음).
  - 임시로 오늘 날짜의 "[TODO 마감]"으로 시작하는 이벤트를 전부 찾아서 지우는 일회성
    정리 스크립트를 돌려서 테스트 잔여물 7개를 정리함 (그런데 이 스크립트가 "오늘 전체"를
    기준으로 찾다 보니, 아직 살아있던 12:30 테스트용 이벤트까지 같이 지워버림 — 사용자가
    "왜 12시 30분 것도 지워졌냐"고 물어봐서 이유를 설명함. DB의 할일 레코드 자체는
    안 건드렸다고 명확히 구분해서 답변함).
  - **정식 기능으로 구현**: `google_calendar.py`에 `delete_event(refresh_token, event_id)`
    추가. `models.py`에 `CalendarEventLog`(kakao 전용 테이블, `todo_id`/`user_id`/`event_id`)
    추가 — 할일이 삭제되면 그 행 자체가 사라지므로, "이 이벤트가 어느 할일 것이었는지"를
    별도 로그로 남겨둬야 나중에 찾아 지울 수 있음. `notifier.send_created_notification()`이
    이벤트 생성 성공 시 이 로그에 기록. `scheduler.cleanup_deleted_todo_events()`가
    주기적으로(+ 봇 시작 직후 즉시) 이 로그를 훑어서 `todo_id`가 더 이상 `todos`에 없는
    행을 찾아 캘린더 이벤트를 지우고 로그도 지움.
  - **실제 계정으로 end-to-end 검증**: 할일 생성 → `CalendarEventLog` 생성 + 실제 캘린더에
    이벤트 존재 확인 → 할일 삭제 → `cleanup_deleted_todo_events()` 실행 → 로그 삭제됨 +
    캘린더에서 이벤트 실제로 사라짐, 전부 확인.
  - **알려진 한계**: 즉시 반영이 아니라 다음 정리 주기(또는 재시작)까지 최대 폴링 주기만큼
    캘린더에 이벤트가 남아있을 수 있음. 실시간으로 하려면 backend의
    `DELETE /todos/{id}`가 kakao에 알려주는 방법이 필요한데(백엔드 파일 수정 필요),
    지금은 거기까지 안 함.
- 이 과정에서 사용자가 "일단 그럼 다시 테스트용도로 12시 노말 수업일정 추가해줘" →
  "일단 모든 일정 삭제해줘" → "12시 30분에는 바로 삭제해줘 그리고 12시 30분에 노말로
  수업으로 예약해줘"(자동 삭제 예약) → "예약 삭제는 그냥 없애고 구글 캘린더에 일정
  삭제하는거 추가해줘" → "DB도 삭제해줘" 순으로 여러 차례 테스트 데이터 생성/삭제를
  반복함. 최종적으로 테스트 할일/이벤트는 전부 정리된 상태, 유저 계정(discord_id/
  google_refresh_token_encrypted)만 남아있음.
- 봇 재시작을 이 세션에서 유난히 많이 함(디버깅 때문) → 한 번은 두 번째 연결 스크립트가
  타임아웃 남 (아마 Discord IDENTIFY 짧은 시간 내 반복 제한 추정). 너무 잦은 재시작/동시
  연결은 피할 것 — 되도록 떠있는 프로세스의 자연스러운 폴링을 기다리거나, 정말 필요할
  때만 재시작할 것.

## 2026-09-08: 카테고리(중요/업무/개인/기타)별 알림 문구 차별화 추가

사용자 요청: "category에서 중요/업무/개인/기타 이 네 개를 한국어 그대로 받을 예정인데,
그거에 따라 alarm_style(노말/러브/네깅) 알림에도 차별점을 달라." 기존엔 `alarm_style`만
보고 문구를 골랐는데, 이제 `alarm_style` x `category` 조합(3 x 4 = 12가지)마다 다른
문구를 갖도록 `messages.py`를 재구성함:

- `_TEMPLATES`/`_CREATED_TEMPLATES`를 `dict[style][category] -> list[str]` 2단 구조로 변경.
- `category`가 None이거나 "중요"/"업무"/"개인"/"기타" 넷 중 하나가 아니면 "기타"로 취급
  (`_resolve()` 헬퍼). `alarm_style`도 마찬가지로 모르는 값이면 "normal"로 대체(기존 동작
  유지).
- `build_message()`, `build_created_message()` 시그니처에 `category` 파라미터 추가
  (기본값 None, 하위 호환 유지 — 기존에 category 없이 호출하던 코드도 안 깨짐).
- `notifier.py`가 `todo.category`를 그대로 넘겨주도록 두 호출부 수정.
- 지금은 칸마다 문구 1개씩만 넣어둠(총 24개: 2 알림종류 x 3스타일 x 4카테고리). 나중에
  다양성 더 원하면 각 칸의 리스트에 문구만 추가하면 됨(랜덤 선택 로직은 이미 있음).
- 사용자가 "다 넣었으면 대사도 모두 출력해서 보여줘"라고 요청 → 실제로 스크립트 돌려서
  24개 조합 전부 터미널에 출력해서 보여주고, 같은 표를 README에도 "카테고리별 알림 문구
  차별화" 섹션으로 옮겨 기록해둠 (제목 "보고서 작성" 기준 예시).
- import 재검증 통과. 실제 봇으로 실사용 테스트는 아직 안 함(문구 생성 로직만 단위
  테스트하듯 확인함) — 다음에 실제 category 값을 가진 할일로 실사용 테스트 추천.
