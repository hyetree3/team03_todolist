# Todo List 알림 서비스 — 설치 가이드

Todo 앱 + Discord/Google Calendar 알림 서비스입니다. 이 문서는 **처음 이 저장소를
받아서 내 컴퓨터에서 실행해야 하는 사람**을 위한 가이드입니다. 순서대로 따라 하면 됩니다.

## 0. 미리 설치해야 하는 것

- **Python** (3.11 이상)
- **Node.js LTS** — https://nodejs.org 에서 설치
- **팀 시크릿 값** — Discord/Google 연동에 필요한 실제 키 값들. 아래 2단계에서 채워
  넣어야 하는데, git에는 올라가 있지 않으므로 **Discord/Google 연동 담당 팀원에게
  직접 받으세요.**

## 1. 저장소 받기

```bash
git clone https://github.com/hyetree3/team03_todolist.git
cd team03_todolist
git checkout sum
```

## 2. backend 설정

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` 파일을 열어서 아래 값을 채우세요:

| 값 | 어떻게 채우나 |
|---|---|
| `SECRET_KEY` | 아무 랜덤 문자열 (나만 쓰면 됨, 팀원마다 달라도 무방) |
| `DATABASE_URL` | 그대로 두면 됨 (`sqlite:///./app.db`) |
| `DISCORD_APPLICATION_ID` | **팀 공유 값** — 연동 담당 팀원에게 받기 |
| `DISCORD_CLIENT_SECRET` | **팀 공유 값** — 연동 담당 팀원에게 받기 |
| `DISCORD_BOT_TOKEN` | **팀 공유 값** — 연동 담당 팀원에게 받기 |
| `GOOGLE_CLIENT_ID` | **팀 공유 값** — 연동 담당 팀원에게 받기 |
| `GOOGLE_CLIENT_SECRET` | **팀 공유 값** — 연동 담당 팀원에게 받기 |
| `ENCRYPTION_KEY` | **팀 공유 값** — 연동 담당 팀원에게 받기 |

> ⚠️ 이 표의 "팀 공유 값"들을 빈 채로 두면, Discord/Google 연동 버튼을 눌렀을 때
> `client_id=`가 빈 URL로 이동하면서 알 수 없는 에러(예: "이메일을 인증해야 해요")가
> 뜹니다. 안내받은 값을 정확히 그대로 복사해 넣으세요.

## 3. frontend 설정

```bash
cd frontend
npm install
copy .env.example .env
```

`.env`의 `VITE_API_BASE_URL`은 그대로 두면 됩니다 (`http://localhost:8000`).

## 4. kakao 설정 (선택 사항)

`/start` 슬래시커맨드를 쓸 계획이 없다면 건너뛰어도 됩니다. 알림 발송에는 필요 없습니다.

```bash
cd kakao
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy env.example .env
```

## 5. 실행하기

`runserver\start-all.bat`을 더블클릭하면 backend·frontend·kakao 봇이 각각 새 창으로
뜹니다. 브라우저에서 **http://localhost:5173** 을 열면 사이트가 보입니다.

끌 때는 각 창에서 `Ctrl+C`를 누르거나 창을 닫으면 됩니다. 다시 켜기 전에는 **열려있던
창을 꼭 먼저 정리**하세요 — 안 닫고 다시 실행하면 옛날 창이 계속 떠 있어서 알림이 중복
발송될 수 있습니다.

## 자주 겪는 문제

- **Discord/Google 연동 버튼을 눌렀는데 이상한 에러가 뜬다** → 2단계의 `.env` 값이
  비어있지 않은지 먼저 확인하세요. 브라우저 주소창의 `client_id=` 뒤에 값이 있는지 보면
  바로 알 수 있습니다.
- **Discord 연동에서 "계정 액세스를 승인할 수 없다"는 식으로 막힌다** → Discord
  Developer Portal(연동 담당 팀원 계정) → 해당 앱 → **봇** 메뉴의 **"공개 봇"**, **설치**
  메뉴의 **"사용자 설치"**가 켜져 있는지 확인해달라고 요청하세요.
- **Google 연동이 `403 access_denied`로 막힌다** → 그 사람의 구글 계정이 아직 "테스트
  사용자"로 등록 안 된 것입니다. Google Cloud Console(연동 담당 팀원 계정) → OAuth 동의
  화면 → 테스트 사용자 → 그 이메일 추가.
- **`.venv`를 폴더째 복사해왔더니 이상하게 동작한다** → `.venv`는 만들어진 경로가 내부에
  고정으로 박혀 있어서 복사하면 깨집니다. 항상 그 자리에서 새로 `python -m venv .venv`로
  만드세요.
- **git 브랜치를 전환했더니 파일이 사라졌다** → 커밋 안 된(untracked) 파일은 브랜치
  전환/`git reset --hard` 중에 경고 없이 지워질 수 있습니다. 의미 있는 변경을 했으면
  브랜치를 옮기기 전에 먼저 커밋하세요.

## 더 자세한 내용은

- `backend/README.md`, `backend/API_계약서.md` — API 상세 스펙
- `frontend/README.md` — 프론트 환경변수/실행법
- `kakao/README.md` — Discord/Google 연동이 어떻게 만들어졌는지의 역사, Discord/Google
  개발자 콘솔 설정법 등
- 이 프로젝트가 지금 구조(backend가 알림/캘린더를 직접 처리하는 방식)로 통합된 배경은
  `kakao/CLAUDE.md`에 자세히 기록되어 있습니다.
