# kakao 파트 — Discord 봇 + Google Calendar 알림

`E:\work\CLAUD.MD` 기준 역할 3번(재원) 담당 모듈. **backend/**, **frontend/** 폴더는 이 파트에서 건드리지 않는다.

## 이 모듈이 하는 일

- `scheduler.py`가 `.env`의 `NOTIFICATION_CHECK_INTERVAL_MINUTES`마다 DB를 조회해서
  `is_done=False AND notified=False AND due_at가 (지금~지금+1시간)` 인 할일을 찾는다
  (시간은 전부 KST 기준, `timeutil.now_kst()` 참고 — backend와 동일한 규칙).
- 대상 할일마다 `notifier.send_notification()`을 호출해서
  - `discord_id`가 있으면 Discord DM 발송 (문구는 `user.alarm_style`에 맞춰
    `messages.py`가 love/normal/nagging 중 하나를 랜덤으로 고름)
  - 구글 캘린더가 연동돼 있으면(`google_refresh_token_encrypted` 존재) 캘린더에 일정 생성
- 발송에 성공한 것만 `notified=True`로 갱신해 중복 발송을 막는다.

## ✅ 백엔드와의 스케줄러 중복 이슈 — 해결됨

이전에 백엔드(`backend/app/scheduler.py`)에도 별도의 5분 주기 알림 스케줄러가 있어서
이 kakao 모듈과 같은 `notified` 플래그를 두고 경쟁할 수 있다는 문제가 있었다.
**혜림님 쪽에서 정리 완료**: `backend/main.py`에서 `start_scheduler()` 호출을 꺼두고,
"개인 알림은 kakao 모듈이 전담한다"는 주석을 남겨둠. 즉 **개인별 알림(Discord DM/Google
Calendar)은 이 kakao 모듈만 발송하며, backend 스케줄러는 실행되지 않는다.**
(백엔드의 `scheduler.py`/`notifications.py` 코드 자체는 팀 공용 채널 공지용으로 남아있을
뿐, 지금은 호출되지 않음.)

## 다른 팀원(민서/혜림)에게 요청해야 하는 것

1. ~~회원가입 폼에 `discord_id` 입력 필드 추가~~ — 이미 backend에 구현되어 있음.
2. ~~스케줄러 중복 문제 정리~~ — 해결됨 (위 항목 참고).
3. ~~`google_refresh_token_encrypted` 컬럼 추가~~ — 이미 `backend/app/models.py`에 동일한
   이름으로 추가되어 있음을 확인함.
4. **"Discord 연동" 버튼을 회원가입/설정 화면에 추가** — 아래 "Discord 계정 연동 방식" 참고.
   버튼이 `GET /auth/discord/login?user_id=<로그인한 유저 id>`를 호출하고, 응답으로 온
   `auth_url`로 그냥 리다이렉트만 시키면 됨 (구글 캘린더 연동 버튼과 완전히 같은 패턴).
   (아직 요청/반영 안 됨)
5. 나중에 백엔드 FastAPI 앱에 합칠 때 `routers/google_auth.py`, `routers/discord_auth.py`
   두 라우터를 옮겨 넣을 것. 단순 `include_router`가 아니라 실제 코드 몇 줄을 backend의
   모델/세션을 쓰도록 고쳐야 함 — 아래 "🔗 나중에 backend와 합칠 때" 섹션 참고.
   (아직 요청/반영 안 됨)
6. **회원가입 시 email/discord_id 필수 검증 재검토 요청** — 지금 backend의
   `POST /auth/register`는 `email`/`discord_id` 중 최소 하나가 없으면 `422`를 내는데,
   이제 Discord는 회원가입 시점이 아니라 "설정 화면에서 OAuth 버튼 클릭"으로 나중에
   연동하는 흐름이 됐다. 그러니 Discord만으로 알림받고 싶은 사용자가 가입 시점엔 아직
   `discord_id`가 없어서(연동 전이라) 이 검증에 막힐 수 있다. 정책을 어떻게 할지
   (가입 시엔 email만 필수로 바꿀지, 그대로 둘지) 혜림님과 상의 필요. (아직 요청/반영 안 됨)

## Discord 계정 연동 방식: OAuth 버튼 (2026-09-08, 실제 계정으로 검증 완료)

처음엔 회원가입 폼에서 Discord 숫자 ID를 직접 입력받으려 했는데, 일반 사용자가 그 숫자 ID를
찾는 것 자체가 너무 번거로워서(개발자 모드 켜고 우클릭 → 복사) **OAuth 연동 버튼 방식으로
바꿨다.** 구글 캘린더 연동과 똑같은 흐름이다.

1. 사용자가 "Discord 연동" 버튼 클릭 → `GET /auth/discord/login?user_id=<id>` 호출
2. 응답의 `auth_url`로 리다이렉트 → Discord 로그인/권한 수락 화면
3. 사용자가 수락 → Discord가 `/auth/discord/callback`으로 리다이렉트
4. 콜백에서 자동으로 그 사람의 진짜 숫자 ID를 알아내 `discord_id`에 저장 → 완료

이 인증에는 `identify`(프로필 조회) 스코프뿐 아니라 `applications.commands` 스코프도
같이 요청한다 — 이걸로 User-Install 앱 설치까지 이 한 번의 인증으로 같이 처리되기 때문이다
(Discord 봇은 접점 없는 상대에게 먼저 DM을 못 보내므로, 이 설치가 필요하다).

### 필요한 사전 설정 (Developer Portal, 코드 아님)

1. 해당 앱 → **OAuth2** 메뉴 → **Client Secret** 발급 → `.env`의 `DISCORD_CLIENT_SECRET`에 입력
2. 같은 화면의 **Redirects**에 `DISCORD_REDIRECT_URI`(`.env`)와 정확히 같은 주소 등록
   (지금은 `http://localhost:8000/auth/discord/callback`)

### ✅ 검증 완료: `/start` 없이도 동작함

실제 계정에서 앱을 완전히 제거한 뒤 `/start`는 한 번도 실행하지 않고 **OAuth 연동만**
다시 진행 → `send_dm()`으로 DM이 정상 도착하는 것까지 확인했다. **`/start` 커맨드는
더 이상 필수 단계가 아니다** — "Discord 연동" 버튼(OAuth) 하나로 설치+접점 확보가
전부 끝난다. `discord_bot.py`의 `/start` 커맨드는 코드에 남겨두되(만약을 위한 백업
경로), 사용자 온보딩 안내에서 필수로 요구하지 않아도 된다.

## 실행 방법

```bash
cd kakao
pip install -r requirements.txt
cp env.example .env   # 이미 만들어져 있으면 생략, 실제 값 채우기
python main.py
```

## DB에 대해

지금은 이 폴더 실행 시 `kakao/app.db`에 `users`/`todos` 테이블을 CLAUD.md 스키마 그대로
생성해서 **독립적으로 테스트**한다. 백엔드가 이미 자체 `backend/app.db`를 실제로 운영 중이므로,
나중에 통합할 때는 `DATABASE_URL`을 백엔드와 동일한 DB 파일 경로로 맞춰야 한다 (아직 안 함 —
경로를 언제 합칠지는 팀과 상의 필요).

`models.py`는 2026-09-08 기준으로 backend 최종 스키마(`memo`/`category`/`point`/`alarm_style`/
`google_refresh_token_encrypted`)와 컬럼 구성을 맞춰뒀다. `google_refresh_token_encrypted`는
이미 `backend/app/models.py`에도 같은 이름으로 존재한다 — 더 요청할 필요 없음.

## 🔗 나중에 backend와 합칠 때 (통합 체크리스트)

이 모듈은 두 가지 서로 다른 방식으로 backend와 연결된다. 합칠 때 이 둘을 헷갈리면 안 된다.

**A) 알림 엔진 (`main.py` = 스케줄러 + Discord 봇 + Google Calendar)**
→ **backend와 같은 프로세스로 합칠 필요가 없다.** `python main.py`를 backend와는 별개의
프로세스로 계속 띄워두고, `.env`의 `DATABASE_URL`만 backend가 실제로 쓰는 DB 파일과
같은 경로(절대경로 권장, 예: `sqlite:///E:/work/team03_todolist/backend/app.db`)로
맞추면 끝난다. kakao의 `models.py`와 backend의 `app/models.py`는 서로 다른 Python
클래스지만 같은 테이블 이름/컬럼을 가리키므로, 같은 SQLite 파일을 여는 것만으로 문제없이
같이 동작한다 (SQLite는 여러 프로세스의 동시 접근을 허용함).

**B) OAuth 라우터 2개 (`routers/google_auth.py`, `routers/discord_auth.py`)**
→ 이건 다르다. Google/Discord가 콜백을 보내는 주소(`GOOGLE_REDIRECT_URI`,
`DISCORD_REDIRECT_URI`)가 **backend가 실제로 실행 중인 포트(8000)**를 가리키고 있어서,
이 두 라우터는 **backend의 FastAPI 프로세스 안에서 직접 실행돼야** 한다 (kakao를 껐다 켰다
해도 콜백은 항상 backend 서버가 받는다). 단순히 파일을 복사해서
`app.include_router(google_auth_router)`만 하면 안 되고, 아래 두 가지를 같이 고쳐야 한다:
1. 두 라우터 파일 안의 `from db import get_session` → `from app.database import get_session`,
   `from models import User` → `from app.models import User`로 바꿔서 backend의 실제 DB
   세션/모델을 쓰도록 해야 한다. (kakao 자체의 `models.py`/`db.py`를 그대로 쓰면 backend와
   전혀 다른 DB 세션을 열게 되어, 콜백에서 저장한 `discord_id`/`google_refresh_token_encrypted`가
   kakao 쪽 DB에만 남고 backend DB에는 반영이 안 된다 — 반드시 backend의 모델/세션을 써야 함.)
2. `crypto_utils.py`(구글 토큰 암호화)도 같은 이유로 backend 프로세스 안에서 import 가능한
   위치로 옮기거나 경로를 맞춰야 한다.

즉, 실제 운영 형태는: **backend 프로세스**(FastAPI, 웹 API + 위 OAuth 콜백 2개) +
**kakao 프로세스**(스케줄러 + Discord 봇, 같은 DB 파일을 바라봄) 이렇게 **두 개의 별도
프로세스**로 계속 돌아가는 게 맞다. OAuth 라우터 코드만 backend 저장소 쪽으로 옮겨서
합치면 된다 (이 작업은 backend 파일을 고치는 일이라, 재원님이 혜림님과 함께 진행하거나
명시적 허락을 받고 진행할 것 — kakao 세션에서 backend 파일을 직접 수정하지 않는다).
