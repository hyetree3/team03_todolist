# kakao 파트 — Discord 봇 + Google Calendar 알림

`E:\work\CLAUD.MD` 기준 역할 3번(재원) 담당 모듈. **backend/**, **frontend/** 폴더는 이 파트에서 건드리지 않는다.

## 이 모듈이 하는 일

원본 스펙: "할일 생성 시, 마감시간 1시간 전"에 알림 — 절대 마감 정각에는 보내지 않음.
시간은 전부 KST 기준(`timeutil.now_kst()`, backend와 동일 규칙).

1. **생성 알림** — 할일이 생성되면 `notifier.send_created_notification()` 호출:
   - `discord_id`가 있으면 "등록됐어요" 스타일 DM 발송
   - 구글 캘린더가 연동돼 있고(`google_refresh_token_encrypted` 존재) 마감이 있으면
     **지금 바로** 캘린더에 일정 생성 (마감 임박 시점이 아니라 생성 시점에 만들어야
     구글 자체의 "60분 전 팝업" 리마인더가 실제로 의미 있게 작동함)
   - 성공하면 `created_notified=True`로 갱신
2. **마감 임박 알림** — **마감 1시간 전 정각에 정확히** `notifier.send_due_soon_notification()`
   호출 (2026-09-08 개선, 아래 "정확한 시각에 발송하는 방법" 참고):
   - `discord_id`가 있으면 "마감 임박" 스타일 DM 발송 (캘린더 일정은 1번에서 이미 만들어졌으므로
     여기선 또 만들지 않음, 중복 생성 방지)
   - 성공하면 `notified=True`로 갱신

두 알림 다 문구는 `user.alarm_style`(love/normal/nagging)에 맞춰 `messages.py`가 랜덤으로
고른다. `alarm_style`은 할일 단위가 아니라 **계정 전체 설정**이라서, 알림이 나가기 전에
바꾸면 아직 안 나간 알림은 새 스타일로 나간다.

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
7. **`todos` 테이블에 `created_notified` 컬럼 추가 요청** — "할일 생성 시 알림" 기능
   (아래 참고)을 위해 kakao 쪽에서 새로 필요해진 컬럼이다 (`notified`와 별개, boolean,
   기본값 false). 지금은 kakao 자체 로컬 DB에만 있고 `backend/app/models.py`에는 없다.
   나중에 DB를 합칠 때 backend 쪽에도 이 컬럼을 추가해달라고 요청해야 한다.
   (아직 요청/반영 안 됨)

## 할일 생성 시 알림 (2026-09-08 추가)

원본 스펙에 "할일 생성 시, 마감시간 1시간 전"에 둘 다 알림을 보내라고 되어 있었는데,
그동안 "마감 1시간 전"만 구현돼 있었다. 이번에 "생성 시 알림"도 추가했다 — 위 "이 모듈이
하는 일" 섹션 참고. `models.py`의 `created_notified` 컬럼(신규, 위 7번 참고)으로 중복
발송을 막는다.

## 마감 1시간 전 알림을 정확한 시각에 보내는 방법 (2026-09-08 개선)

원래는 5분마다 "마감이 1시간 이내로 남은 할일이 있는지" 훑어보는 폴링 방식이라, 실제
발송 시각이 정확히 마감 1시간 전이 아니라 최대 폴링 주기(5분)만큼 늦게 나갈 수 있었다.
지금은 할일마다 **"마감-1시간" 정각에 딱 한 번 실행되는 예약(APScheduler `date` 트리거)**을
걸어두는 방식으로 바꿨다 (`scheduler.schedule_due_soon()`):

- 할일이 생성되는 시점, 그리고 **봇이 시작될 때 한 번**(`_schedule_all_pending_due_soon()`,
  봇이 꺼져있던 동안 생성된 할일도 포함) 이 예약이 걸린다.
- 마감까지 이미 1시간이 안 남은 채로 생성됐으면 지금 바로 실행되도록 예약한다.
- 기존의 5분 폴링(`check_and_notify()`)은 그대로 남겨뒀지만, 이제는 **안전망 역할만** 한다 —
  이 정밀 예약이 어떤 이유로든 안 걸린 경우(예: 봇이 꺼져있는 동안 마감-1시간 시각을 이미
  지나쳐버린 극단적인 경우)에만 대신 잡아준다. 봇이 계속 켜져 있는 정상적인 상황에서는
  **항상 정확한 시각에 발송된다.**
- 주의: 이 예약은 메모리에만 있어서 봇이 재시작되면 사라지는데, 재시작될 때 다시 전부
  정확하게 재예약되므로(위 참고) 문제되지 않는다. 진짜 정밀도가 떨어지는 건 "생성~마감 1시간
  전 사이에 봇이 계속 꺼져있다가 그 시각을 이미 지난 뒤에야 다시 켜지는" 경우뿐이다.
- 가짜 데이터로 시뮬레이션 테스트 완료: 마감이 임박한(이미 1시간 안 남은) 할일은 즉시 실행,
  마감이 먼 할일은 정확한 시각(`due_at - 1시간`)에 잡이 등록되는 것까지 확인함.

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

## ✅ Google Calendar 연동 (2026-09-08, 실제 계정으로 검증 완료)

`routers/google_auth.py`의 `/auth/google/login` → 구글 로그인/권한 수락 →
`/auth/google/callback` → `google_refresh_token_encrypted` 저장까지, 그리고 저장된 토큰으로
`google_calendar.create_reminder_event()`를 호출해 **실제 Google Calendar에 일정이
생성되는 것**까지 실제 계정으로 끝까지 확인했다. 아래 "테스트 사용자" 관련 사항만 주의하면
바로 쓸 수 있다.

## ⚠️ Google Calendar 연동: 지금은 "테스트 사용자"만 로그인 가능 (팀원 전원 확인 필요)

Google OAuth 동의 화면이 아직 **"테스트"** 상태다. 이 상태에서는 **미리 등록한 이메일만**
구글 로그인이 되고, 그 외 계정으로 시도하면 `403 access_denied` 에러가 뜬다
(`redirect_uri_mismatch`와는 다른 별개의 에러 — 이것도 실제로 겪어서 확인함).

- **테스트 계정을 추가하려면**: Google Cloud Console → **API 및 서비스** → **OAuth 동의 화면**
  → **테스트 사용자** 섹션 → **사용자 추가** → 이메일 입력 → 저장 (최대 100명까지 등록 가능).
- **팀원이나 발표 대상자가 구글 캘린더 연동을 테스트해보려면, 그 사람 구글 이메일을 여기에
  먼저 추가해야 한다.** 안 그러면 위 에러가 뜬다.
- **불특정 다수가 실제로 가입해서 쓰는 서비스로 만들려면** OAuth 동의 화면을 "프로덕션"으로
  게시해야 하는데, 캘린더 권한(`calendar.events`)이 Google이 분류한 "민감한 범위"라서
  Google의 앱 검토(개인정보처리방침 페이지, 데모 영상 제출 등, 심사 기간 있음)를 받아야
  경고 화면 없이 배포된다. **지금 이 프로젝트 규모(팀 과제)에서는 검토까지 받을 필요 없이,
  테스트 사용자 목록에 필요한 사람만 추가하는 지금 방식으로 충분하다.** 나중에 정말 공개
  서비스로 확장하고 싶을 때만 팀과 상의해서 검토를 받으면 된다.
- 리디렉션 URI 등록 시 주의: Google Cloud Console의 OAuth 클라이언트 설정 화면에는
  **"승인된 자바스크립트 원본"**(경로 없이 도메인만, 예: `http://localhost:8000`)과
  **"승인된 리디렉션 URI"**(전체 경로 포함, 예: `http://localhost:8000/auth/google/callback`)
  두 섹션이 따로 있다. `GOOGLE_REDIRECT_URI`는 반드시 **후자**에 등록해야 한다 — 전자에
  넣으면 "URI는 경로를 포함하거나 '/'로 끝날 수 없습니다" 에러가 뜬다.

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
