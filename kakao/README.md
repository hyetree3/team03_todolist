# kakao 파트 — Discord 봇 + Google Calendar 알림

`E:\work\CLAUD.MD` 기준 역할 3번(재원) 담당 모듈. **backend/**, **frontend/** 폴더는 이 파트에서 건드리지 않는다.

## 이 모듈이 하는 일

- `scheduler.py`가 `.env`의 `NOTIFICATION_CHECK_INTERVAL_MINUTES`마다 DB를 조회해서
  `is_done=False AND notified=False AND due_at가 (지금~지금+1시간)` 인 할일을 찾는다.
- 대상 할일마다 `notifier.send_notification()`을 호출해서
  - `discord_id`가 있으면 Discord DM 발송
  - 구글 캘린더가 연동돼 있으면(`google_refresh_token_encrypted` 존재) 캘린더에 일정 생성
- 발송에 성공한 것만 `notified=True`로 갱신해 중복 발송을 막는다.

## ⚠️ 백엔드와의 통합 관련 미해결 이슈 (진행 전 꼭 확인)

백엔드(`backend/app/scheduler.py`, `backend/app/notifications.py`)에도 이미 5분 주기
알림 스케줄러가 있는데, 그쪽은 **개인별 DM이 아니라 팀 공용 Discord 웹훅 채널**로
`"[마감 임박] {username}님의 할일 '{title}'이(가) 곧 마감입니다"` 형태로 발송하는 방식이다.
이 kakao 모듈과 백엔드 스케줄러를 동시에 켜두면 같은 DB의 같은 할일을 두고
서로 `notified` 플래그를 다투게 되어 중복/누락 발송이 생길 수 있다.

정리가 필요한 것:
- 백엔드 스케줄러(`start_scheduler()` 호출)를 끄고 이 kakao 모듈만 개인 알림을 담당할지,
- 아니면 백엔드의 `send_notification(text)` 시그니처를 바꿔 이 모듈을 호출하도록 만들지

혜림님과 상의해서 정하기 전까지는, **backend와 kakao 스케줄러를 동시에 실행하지 말 것.**

## 다른 팀원(민서/혜림)에게 요청해야 하는 것

1. ~~회원가입 폼에 `discord_id` 입력 필드 추가~~ — 이미 backend에 구현되어 있음을 확인함
   (`POST /auth/register`에 `discord_id` 선택 필드 존재).
2. **"Discord 봇 설치 안내"를 회원가입 완료 화면 등에 노출** — 아래 "사용자가 해야 할 일" 참고.
3. 위 스케줄러 중복 문제를 어떻게 정리할지 협의.
4. 나중에 백엔드 FastAPI 앱에 Google OAuth를 합칠 때 `routers/google_auth.py`의 라우터를
   포함(`app.include_router(google_auth_router)`)시키고, `.env`의 `GOOGLE_REDIRECT_URI` 포트를
   실제 백엔드 포트(8000)와 맞출 것.

## Discord 연동 방식: 서버 대신 "개인 계정에 앱 설치"

Discord 봇은 상대방과 아무 접점이 없으면 먼저 DM을 보낼 수 없다(스팸 방지 정책, 기술적으로 우회 불가).
이 프로젝트는 전용 서버를 만들지 않는 대신, **User-Installable App**(2024년 이후 Discord 지원 기능) 방식을 쓴다:
서버 가입 없이, 사용자가 자기 계정에 이 봇 앱을 설치하기만 하면 접점이 생겨서 DM을 받을 수 있다.

### 사용자가 해야 할 일 (최초 1회)

1. 재원님이 안내하는 "앱 설치 링크"를 클릭해 자기 Discord 계정에 앱을 설치(권한 허용).
2. 아무 채팅창(봇과의 DM 등)에서 `/start` 슬래시 커맨드를 한 번 실행 — "알림이 활성화되었습니다" 응답이 뜨면 완료.

### 설치 링크 만드는 법 (재원님이 할 설정 작업, 코드 아님)

1. https://discord.com/developers/applications → 해당 앱 선택 → **Installation** 메뉴
2. "Installation Contexts"에서 **User Install** 체크 (Guild Install은 꺼도 됨)
3. Default Install Settings의 Scopes에 `applications.commands` 추가
4. 생성되는 "Install Link"를 복사해서 사용자에게 전달 (회원가입 완료 페이지 등)

### ⚠️ 검증 필요 사항

"서버 없이 앱 설치 + `/start` 커맨드 실행"만으로, 이후 스케줄러가 **먼저** 보내는 DM(사용자의
슬래시 커맨드에 대한 응답이 아니라, 예약 작업이 자체적으로 여는 DM)이 항상 허용되는지는
Discord 쪽에 100% 명문화된 문서가 없다. 실제 계정으로 아래 순서를 꼭 테스트해볼 것:

1. `/start` 커맨드 실행
2. 몇 분 뒤 `scheduler.check_and_notify()`가 (테스트 데이터로) `discord_bot.send_dm()`을 호출하도록 유도
3. 실제로 DM이 도착하는지 확인

만약 막히면(`discord.Forbidden`), 서버 방식으로 되돌리거나, `/start` 응답 자체에 알림을 몰아 보내는
방식(예: 사용자가 주기적으로 `/todo` 커맨드를 실행해서 결과를 받아보는 pull 방식)으로 대체해야 한다.

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
나중에 통합할 때는 `DATABASE_URL`을 백엔드와 동일한 DB 파일 경로로 맞춰야 한다.

`models.py`의 `google_refresh_token_encrypted` 컬럼은 백엔드 스키마에는 없고,
구글 캘린더 연동을 위해 이 파트에서 추가한 컬럼이다. 백엔드 테이블에도 이 컬럼(또는 동등한 것)이
필요하다는 점을 혜림님과 상의해야 한다.
