# Todo List 알림 서비스 — 통합 안내

3명이 나눠서 만든 Todo 앱을 **하나의 사이트**로 합쳐서 실행하는 방법을 정리한 문서입니다.
처음 보는 사람(팀원)도, 나중에 이 저장소를 여는 Claude Code 세션도 이 문서 하나만 읽으면
전체 그림을 이해할 수 있도록 썼습니다.

## 이 저장소의 구성

```
(저장소 루트)
├── backend/   FastAPI + SQLite. 회원가입/로그인/할일 CRUD + 통계 + 포인트 + Discord/Google 연동
├── frontend/  React + Vite. 사용자가 실제로 보는 화면
├── kakao/     Discord 봇 (지금은 /start 슬래시커맨드 보조용, 알림 발송에는 더 이상 필요 없음)
└── runserver/ 셋을 한 번에 켜는 실행 스크립트
```

작업은 `sum` 브랜치에서 진행 중입니다. 클론한 경로가 어디든(팀원마다 다를 수 있음) 아래
설정 그대로 동작하도록 전부 상대경로 기준으로 맞춰뒀습니다.

담당은 원래 프론트(민서) / 백엔드+DB(혜림) / Discord+Google 연동(재원) 세 명이었고, 이
문서가 정리하는 통합 작업으로 세 폴더가 실제로 하나의 사이트처럼 동작하게 됐습니다.

## 한 번에 실행하기

`runserver\start-all.bat`을 더블클릭하면 backend·frontend·kakao 봇이 각각 새 창으로 뜹니다.
브라우저에서 `http://localhost:5173`을 열면 그게 사용자가 보는 사이트입니다.

끌 때는 각 창에서 `Ctrl+C`를 누르거나 창을 닫으면 됩니다. **창을 닫지 않고 그냥 다시
`start-all.bat`을 실행하면 예전 창이 옛날 코드를 든 채로 계속 남아서 알림이 중복 발송되는
등 헷갈리는 일이 생기니, 다시 켜기 전에 열려있던 창을 먼저 정리하세요.**

### 처음 한 번만 해야 하는 준비

각 폴더 실행에 필요한 것들을 처음 한 번만 설치해두면 됩니다.

```bash
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # 그 다음 .env 안의 값들을 실제 값으로 채우기 (아래 참고)

# frontend (Node.js 설치되어 있어야 함 — https://nodejs.org LTS)
cd frontend
npm install
copy .env.example .env

# kakao (선택 — /start 커맨드 쓸 때만 필요)
cd kakao
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy env.example .env
```

**주의**: `.venv`는 만들어진 경로가 내부에 고정으로 박혀서(`activate.bat`), 폴더째
복사하면 깨집니다. 다른 컴퓨터/폴더로 옮길 땐 `.venv`를 복사하지 말고 그 자리에서
새로 `python -m venv .venv`로 만드세요.

### `.env`에 채워야 하는 값

`.env` 파일들은 전부 git에 올라가지 않습니다(`.gitignore` 대상). 실제 값은 팀 내부적으로
공유하세요.

- **backend/.env**: `SECRET_KEY`(아무 랜덤 문자열), `DATABASE_URL`, 그리고 Discord/Google
  연동용 값들(`DISCORD_APPLICATION_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY`) — `.env.example`에 각
  값을 어디서 발급받는지 설명이 있습니다.
- **frontend/.env**: `VITE_API_BASE_URL` (backend 주소, 기본 `http://localhost:8000`)
- **kakao/.env**: `/start` 커맨드를 쓸 계획이 없으면 사실상 안 채워도 됩니다. 채운다면
  `DATABASE_URL=sqlite:///../backend/app.db`처럼 backend와 **같은 DB 파일**을 상대경로로
  가리키게 두세요 (절대경로를 쓰면 다른 컴퓨터/폴더에서 안 맞습니다 — 실제로 겪은 문제라
  꼭 상대경로 유지).

### 데모/발표용 DB가 없거나 초기화됐을 때

`backend/app.db`가 없거나 계정이 하나도 없으면, backend 폴더에서 아래 한 줄로 팀 계정
4개(혜림/재원/민서/교수, 전부 비밀번호 `password123`)와 샘플 할일을 채워 넣을 수 있습니다.

```bash
cd backend
.venv\Scripts\activate
python seed.py
```

이미 있는 계정/할일은 건너뛰므로 여러 번 실행해도 안전합니다.

## 알림/캘린더는 어떻게 동작하는가 (중요, 헷갈리기 쉬운 부분)

**할일은 오직 frontend → backend API(`POST /todos`)를 통해서만 생성됩니다.** 그래서
Discord DM 발송과 구글 캘린더 등록/삭제도 **backend가 할일을 만들고/고치고/지우는 바로 그
순간 직접 처리**합니다 (`backend/app/notifier.py`, `backend/app/notification_scheduler.py`).
예전에는 kakao 폴더의 별도 프로세스가 DB를 5분마다 훑어보며 뒤늦게 알아채는 방식이었는데,
지금은 그렇지 않습니다.

- Discord DM은 `discord.py` 같은 상시 접속(게이트웨이) 없이, **봇 토큰으로 REST API를
  직접 호출**해서 보냅니다(`backend/app/discord_dm.py`). 사용자가 Settings에서 한 번
  연동만 해두면(봇이 계정에 설치됨) 이 방식으로 바로 DM이 갑니다.
- 구글 캘린더는 할일 생성 시 즉시 이벤트를 만들고, 삭제 시 즉시 그 이벤트를 지웁니다.
- "마감 1시간 전" 알림은 할일마다 정확한 시각에 한 번 실행되는 예약(APScheduler)을 걸어서
  보내고, 혹시 서버가 재시작되는 타이밍 등으로 놓치는 게 있을까봐 5분마다 도는 안전망
  스윕도 같이 돌립니다.
- **kakao 프로세스(`python kakao/main.py`)는 이제 알림 발송에 필요 없습니다.** `/start`
  슬래시커맨드(앱 최초 설치 시 보조 접점, 필수 아님)를 위해서만 선택적으로 켜면 됩니다.
  backend와 동시에 켜도 중복 발송되지 않도록 정리돼 있습니다 — kakao 쪽 스케줄러는
  더 이상 시작되지 않습니다.

Discord/Google 연동 자체(OAuth 로그인 버튼, 콜백 처리)는 `backend/app/routers/
discord_auth.py`, `google_auth.py`에 있고, Settings 화면(`frontend/src/pages/
SettingsPage.jsx`)에서 연동/연동 취소를 할 수 있습니다.

## ⚠️ 브랜치 전환할 때 주의 (실제로 파일이 통째로 날아간 적 있음)

`git checkout`이나 `git reset --hard`로 브랜치를 오갈 때, **커밋되지 않은(untracked)
파일은 git이 지워도 경고 없이 그냥 사라질 수 있습니다.** 실제로 이 저장소에서 브랜치를
오가던 중 frontend 전체 소스, kakao 모듈 전체, backend의 Discord/Google 연동 파일들이
한 번에 삭제된 적이 있습니다(다행히 다른 브랜치에 커밋되어 있어서 복구함). 예방하려면:

- 의미 있는 변경을 했으면 **커밋부터 하고** 브랜치를 전환하세요 (커밋 안 된 작업은
  `git stash`를 쓰더라도 untracked 파일까지 포함하려면 `git stash -u`를 써야 합니다).
- `.venv`, `node_modules`, `*.db`처럼 큰 폴더/파일은 실수로 같이 커밋되지 않도록
  `.gitignore`에 반드시 들어있는지 확인하세요.
- `git reset --hard`는 untracked 파일도 아무 경고 없이 지울 수 있어서(`git checkout`
  브랜치 전환보다 더 위험함), 정말 필요할 때만 조심해서 쓰세요.

## 더 자세한 내용은

- `backend/README.md`, `backend/API_계약서.md` — API 상세 스펙
- `frontend/README.md` — 프론트 환경변수/실행법
- `kakao/README.md` — Discord/Google 연동이 어떻게 만들어졌는지의 역사, `/start` 커맨드
  설정법, Google OAuth "테스트 사용자" 등록 방법 등
