# Todo 앱 백엔드

3명이 3일 안에 만드는 Todo(할일 관리) 웹앱의 **백엔드 + DB**입니다. 이 문서는 프론트엔드/API 연동 담당이 이 백엔드와 통신할 때 필요한 내용만 정리한 것입니다. 상세 요청/응답 스펙은 [API_계약서.md](API_계약서.md)를 보세요.

## 이 백엔드가 하는 일

- 회원가입 / 로그인 (자체 아이디-비밀번호, JWT 발급)
- 사용자별 할일 CRUD (로그인한 본인 것만 조회/조작)
- 마감 1시간 전 미완료 할일 알림을 팀 공용 채널로 발송 (프론트 연동 X, 서버 내부 동작)

## 로컬에서 띄우기

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

`.env.example`을 복사해 `.env`로 만들고 `SECRET_KEY` 등을 채운 뒤:

```bash
uvicorn main:app --reload
```

- 서버: `http://localhost:8000`
- 자동 API 문서(Swagger, 직접 호출 테스트 가능): `http://localhost:8000/docs`

## 프론트/연동팀이 알아야 할 것

### 1. 인증 흐름

1. `POST /auth/register`로 회원가입 (`username`, `password` 필수, `email`/`discord_id`는 선택)
2. `POST /auth/login`으로 로그인 → `access_token` 받음
3. 이후 모든 `/todos` 요청 헤더에 `Authorization: Bearer <access_token>` 포함

토큰 없이 `/todos`를 호출하면 `401`이 옵니다.

### 2. CORS

프론트가 다른 포트/도메인에서 호출해도 되도록 전체 origin을 허용해뒀습니다. 대신 **쿠키 기반 인증은 안 쓰고 있어서**(`allow_credentials=False`) 토큰은 반드시 `Authorization` 헤더로 보내야 합니다.

### 3. 자주 헷갈리는 포인트

- 로그인은 표준 OAuth2 폼(form-urlencoded)이 아니라 **회원가입과 동일한 JSON body**입니다.
- 완료 처리는 전용 엔드포인트 없이 `PATCH /todos/{id}` + `{"is_done": true}`로 합니다.
- `due_at`은 마감 없으면 `null`로 옵니다 (빈 문자열/0 아님).
- SQLite DB 파일(`app.db`) 안에서 `is_done`은 `0`/`1`로 저장되지만, **API 응답에서는 항상 `true`/`false`로 내려갑니다** — DB를 직접 열어봤을 때 값이 정수인 건 정상입니다.
- 내 소유가 아닌 할일 `id`에 접근하면 `403`이 아니라 `404`를 줍니다 (존재 자체를 숨김).

### 4. 아직 안 정해진 것 / 범위 밖

- 알림 발송 채널(디스코드/텔레그램)이 미정이라, 알림은 프론트에 직접 연동되는 기능이 아니라 **서버 내부에서만** 도는 백그라운드 작업입니다.
- `users.email`, `users.discord_id`는 구글 캘린더 연동/개인별 디스코드 알림(다른 담당 기능)을 위해 값만 저장해두는 컬럼입니다 — 이 백엔드가 구글 API를 호출하거나 디스코드로 개인 알림을 보내지는 않습니다.
- 소셜 로그인, 비밀번호 재설정, 프로필 편집 등은 이번 범위에 없습니다.

## 폴더 구조

```
backend/
├── main.py              # FastAPI 앱 진입점
├── app/
│   ├── models.py         # DB 테이블 (users, todos)
│   ├── schemas.py        # 요청/응답 스키마
│   ├── security.py       # 비밀번호 해싱 + JWT
│   ├── deps.py            # 인증 의존성 (Authorization 헤더 검사)
│   ├── database.py        # SQLite 연결 설정
│   ├── notifications.py   # 알림 발송 (send_notification)
│   ├── scheduler.py       # 마감 임박 알림 스케줄러 (5분 주기)
│   └── routers/
│       ├── auth.py        # /auth/register, /auth/login
│       └── todos.py       # /todos CRUD
├── seed.py                # 개발용 가라 데이터 삽입 스크립트
└── API_계약서.md          # 엔드포인트별 상세 요청/응답 스펙
```
