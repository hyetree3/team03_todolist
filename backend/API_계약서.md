# API 계약서 — Todo 앱 백엔드

프론트엔드가 이 문서 기준으로 연동하면 됩니다. 계약을 바꿀 일이 생기면 미리 공유하고 바꿉니다.

## 기본 정보

- Base URL (개발): `http://localhost:8000`
- 모든 요청/응답 본문은 `application/json`
- 날짜/시각은 전부 **ISO 8601 문자열, KST(한국시간) 기준** (예: `2026-09-10T18:00:00`, UTC 아님, 타임존 오프셋 안 붙음)
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
  "discord_id": "hyerim#1234",
  "alarm_style": "normal"
}
```
- `email`, `discord_id`: **둘 중 최소 하나는 필수.** 둘 다 안 보내면 `422`. (개인 알림을 디스코드 DM이나 구글 캘린더 중 하나로는 받을 수 있어야 하기 때문 — kakao 알림 모듈에서 사용)
- `alarm_style`: 선택, `"love"` / `"normal"` / `"nagging"` 중 하나만 가능 (기본값 `"normal"`). kakao 알림 모듈이 이 값 보고 알림 메시지 말투를 바꿈. 다른 값 보내면 `422`.

성공 응답 `201`:
```json
{
  "id": 1,
  "username": "혜림",
  "email": "hyerim@gmail.com",
  "discord_id": "hyerim#1234",
  "point": 0,
  "alarm_style": "normal",
  "created_at": "2026-09-07T06:47:30.435483"
}
```
- `point`: 할일 완료 시 쌓이는 포인트 (가입 시 0). 나중에 캐릭터/나무 키우기 기능에 쓰일 예정.

실패: 이미 있는 username → `400`, `email`/`discord_id` 둘 다 없거나 `alarm_style` 값이 셋 중 하나가 아니면 → `422`

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

### `GET /users/me` — 내 정보 조회 (로그인 필요)

요청 body 없음. 성공 응답 `200`: `POST /auth/register` 성공 응답과 같은 형태 (point 포함).
할일 완료해서 point가 바뀐 뒤 최신 값 확인할 때 이 엔드포인트를 다시 호출하면 됩니다.

## 할일 (전부 로그인 필요, 본인 것만 조회/조작)

todo 객체 응답 형태 (공통):
```json
{
  "id": 1,
  "title": "장보기",
  "memo": "우유, 계란, 식빵",
  "category": "🛒",
  "due_at": "2026-03-10T18:00:00",
  "is_done": false,
  "created_at": "2026-03-07T09:00:00"
}
```
- `category`: 할일 구분용 이모지 (자유 문자열, 값 제한 없음 — 프론트가 원하는 이모지를 그대로 보내면 저장/반환만 함)

### `POST /todos` — 할일 생성

요청 body:
```json
{ "title": "장보기", "memo": "우유, 계란, 식빵", "category": "🛒", "due_at": "2026-03-10T18:00:00" }
```
- `memo`, `category`, `due_at` 전부 생략 가능

성공 응답: `201` + todo 객체

### `GET /todos` — 내 할일 목록

요청 body 없음. 성공 응답: `200` + todo 배열 (내 것만, 다른 사람 할일은 안 보임)

### `GET /todos/{id}` — 할일 단건 조회

성공 응답: `200` + todo 객체
실패: 없는 id이거나 남의 id → `404`

### `PATCH /todos/{id}` — 할일 수정 (완료 토글 포함)

요청 body (전부 선택, 보낸 필드만 수정됨):
```json
{ "title": "장보기 (수정)", "memo": "우유는 저지방으로", "category": "🛒", "due_at": "2026-03-11T18:00:00", "is_done": true }
```
- **완료 처리는 이 엔드포인트의 `is_done`으로 한다.** 완료 전용 엔드포인트는 없음.
- `is_done`을 `false → true`로 바꾸면 내 `point`가 10점 오른다 (`true → false`로 되돌리면 다시 10점 차감). 이 응답엔 point가 안 나오니, 바뀐 값은 `GET /users/me`로 확인.

성공 응답: `200` + 수정된 todo 객체
실패: 없는 id이거나 남의 id → `404`

### `DELETE /todos/{id}` — 할일 삭제

성공 응답: `204` (본문 없음)
실패: 없는 id이거나 남의 id → `404`

### `GET /todos/stats?period=today` — 완료율 통계

쿼리 파라미터 `period`: `today`(기본값) / `week`(이번 주 월~일) / `month`(이번 달) / `year`(올해) 중 하나. 다른 값이면 `422`.

성공 응답 `200`:
```json
{ "total": 5, "completed": 2, "completion_rate": 0.4 }
```
- `due_at`이 그 기간 범위 안에 있는 내 할일만 집계 (마감 없는 할일은 제외)
- `total`이 0이면 `completion_rate`는 `0.0`

## 프론트 연동 시 체크리스트

- [ ] 로그인 성공 시 받은 `access_token`을 저장해뒀다가, 이후 모든 `/todos` 요청에 `Authorization: Bearer <token>` 헤더로 보낸다.
- [ ] 토큰 없이 `/todos` 호출하면 `401` — 로그인 페이지로 보내는 처리 필요.
- [ ] `due_at`이 `null`로 오는 경우(마감 없는 할일)를 화면에서 처리한다.
- [ ] 완료 체크박스는 `PATCH /todos/{id}` + `{"is_done": true/false}`로 호출한다.
- [ ] 회원가입 폼에서 `email`/`discord_id` 중 최소 하나는 꼭 입력하게 만든다 (안 그러면 `422`).
- [ ] 회원가입 폼에 알림 말투 선택(`alarm_style`: love/normal/nagging, 기본 normal) UI 넣을지 프론트에서 결정.
