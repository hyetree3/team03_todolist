# API 계약서 — Todo 앱 백엔드

프론트엔드가 이 문서 기준으로 연동하면 됩니다. 계약을 바꿀 일이 생기면 미리 공유하고 바꿉니다.

## 기본 정보

- Base URL (개발): `http://localhost:8000`
- 모든 요청/응답 본문은 `application/json`
- 날짜/시각은 전부 **ISO 8601 문자열** (예: `2026-09-10T18:00:00`)
- 마감 없음 = `due_at: null` (빈 문자열 `""`이나 `0` 아님)
- 완료 여부 = `true` / `false` (`1`/`0`, `"Y"`/`"N"` 아님)
- 인증 실패 `401`, 없는 리소스 `404`, 요청 형식 오류 `422`. 에러 본문은 FastAPI 기본 형식: `{"detail": "..."}`
- API 문서(자동, 직접 테스트 가능): `http://localhost:8000/docs`

## 인증

로그인/보호된 API는 아래 헤더가 필요합니다.

```
Authorization: Bearer <access_token>
```

### `POST /auth/register` — 회원가입

요청 body:
```json
{
  "username": "혜림",
  "password": "password123",
  "email": "hyerim@gmail.com",
  "discord_id": "hyerim#1234"
}
```
- `email`, `discord_id`는 **선택 항목** (안 보내거나 `null` 가능). 구글 캘린더 연동 / 디스코드 개인 알림 기능(다른 담당)에서 쓸 값이라 백엔드는 저장만 하고 직접 사용하지 않음.

성공 응답 `201`:
```json
{
  "id": 1,
  "username": "혜림",
  "email": "hyerim@gmail.com",
  "discord_id": "hyerim#1234",
  "created_at": "2026-09-07T06:47:30.435483"
}
```

실패: 이미 있는 username → `400`

### `POST /auth/login` — 로그인

요청 body:
```json
{ "username": "혜림", "password": "password123" }
```
- 로그인은 `email`/`discord_id` 안 받음 (회원가입 때만).

성공 응답 `200`:
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

실패: 아이디/비밀번호 틀림 → `401`

> ⚠️ 표준 OAuth2 폼(form-urlencoded)이 아니라 **회원가입과 동일하게 JSON body**를 받습니다.

## 할일 (전부 로그인 필요, 본인 것만 조회/조작)

todo 객체 응답 형태 (공통):
```json
{
  "id": 1,
  "title": "장보기",
  "due_at": "2026-03-10T18:00:00",
  "is_done": false,
  "created_at": "2026-03-07T09:00:00"
}
```

### `POST /todos` — 할일 생성

요청 body:
```json
{ "title": "장보기", "due_at": "2026-03-10T18:00:00" }
```
- `due_at`은 생략 가능 (마감 없는 할일)

성공 응답: `201` + todo 객체

### `GET /todos` — 내 할일 목록

요청 body 없음. 성공 응답: `200` + todo 배열 (내 것만, 다른 사람 할일은 안 보임)

### `GET /todos/{id}` — 할일 단건 조회

성공 응답: `200` + todo 객체
실패: 없는 id이거나 남의 id → `404`

### `PATCH /todos/{id}` — 할일 수정 (완료 토글 포함)

요청 body (전부 선택, 보낸 필드만 수정됨):
```json
{ "title": "장보기 (수정)", "due_at": "2026-03-11T18:00:00", "is_done": true }
```
- **완료 처리는 이 엔드포인트의 `is_done`으로 한다.** 완료 전용 엔드포인트는 없음.

성공 응답: `200` + 수정된 todo 객체
실패: 없는 id이거나 남의 id → `404`

### `DELETE /todos/{id}` — 할일 삭제

성공 응답: `204` (본문 없음)
실패: 없는 id이거나 남의 id → `404`

## 프론트 연동 시 체크리스트

- [ ] 로그인 성공 시 받은 `access_token`을 저장해뒀다가, 이후 모든 `/todos` 요청에 `Authorization: Bearer <token>` 헤더로 보낸다.
- [ ] 토큰 없이 `/todos` 호출하면 `401` — 로그인 페이지로 보내는 처리 필요.
- [ ] `due_at`이 `null`로 오는 경우(마감 없는 할일)를 화면에서 처리한다.
- [ ] 완료 체크박스는 `PATCH /todos/{id}` + `{"is_done": true/false}`로 호출한다.
