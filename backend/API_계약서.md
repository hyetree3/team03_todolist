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
{ "username": "혜림", "password": "password123" }
```
- 가입은 **아이디/비밀번호만** 받습니다. `email`/`discord_id`/`alarm_style`은 가입 화면이 아니라 나중에 설정 화면에서 `PATCH /users/me`로 등록/변경합니다.

성공 응답 `201`:
```json
{
  "id": 1,
  "username": "혜림",
  "email": null,
  "discord_id": null,
  "alarm_style": "normal",
  "calender_alarm": false,
  "created_at": "2026-09-07T06:47:30.435483"
}
```
- `alarm_style`: 가입 시 기본값 `"normal"`. `PATCH /users/me`로 나중에 love/normal/nagging 중 선택.
- `calender_alarm`: 구글 캘린더 연동 완료 여부 (기본 `false`). 실제 연동은 다른 담당 기능(OAuth) 몫이고, 여기선 상태만 보여줌.

실패: 이미 있는 username → `400`

### `POST /auth/login` — 로그인

요청 body:
```json
{ "username": "혜림", "password": "password123" }
```

성공 응답 `200`:
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

실패: 아이디/비밀번호 틀림 → `401`

> ⚠️ 표준 OAuth2 폼(form-urlencoded)이 아니라 **회원가입과 동일하게 JSON body**를 받습니다.

### `GET /users/me` — 내 정보 조회 (로그인 필요)

요청 body 없음. 성공 응답 `200`: `POST /auth/register` 성공 응답과 같은 형태.

### `PATCH /users/me` — 설정 변경 (로그인 필요)

가입 후 설정 화면에서 알림 연동 정보를 채우거나 바꿀 때 씁니다. 보낸 필드만 수정됩니다.

요청 body (전부 선택):
```json
{ "email": "hyerim@gmail.com", "discord_id": "hyerim#1234", "alarm_style": "love" }
```
- `alarm_style`은 `"love"` / `"normal"` / `"nagging"` 중 하나만 가능, 다른 값이면 `422`.

성공 응답: `200` + 갱신된 내 정보 (`GET /users/me`와 같은 형태)

### `GET /users/me/points?period=today` — 포인트 기록 (나무/캐릭터 성장용, 로그인 필요)

포인트는 **평생 누적이 아니라 그날그날의 개념**입니다 — 매일 0부터 시작해서 그날 완료한 할일 개수만큼 쌓입니다 (10=새싹, 30=어린식물, 70=나무, 그래픽은 프론트 담당).

쿼리 파라미터 `period`: `today`(기본값) / `week`(이번 주 월~일) / `month`(이번 달) / `year`(올해). 다른 값이면 `422`.

성공 응답 `200`:
```json
{
  "period": "week",
  "total": 30,
  "days": [
    { "date": "2026-09-07", "points": 0 },
    { "date": "2026-09-08", "points": 10 },
    { "date": "2026-09-09", "points": 20 }
  ]
}
```
- `days`는 기간 내 **모든 날짜를 빠짐없이** 포함 (활동 없는 날은 `points: 0`)
- `total`은 그 기간 동안 쌓인 포인트 합계
- 할일을 완료하면(`PATCH /todos/{id}`, `is_done: true`) 그날 `points`가 10 오르고, 다시 미완료로 되돌리면 10 내려감

## 할일 (전부 로그인 필요, 본인 것만 조회/조작)

todo 객체 응답 형태 (공통):
```json
{
  "id": 1,
  "title": "장보기",
  "memo": "우유, 계란, 식빵",
  "category": "개인",
  "due_at": "2026-03-10T18:00:00",
  "is_done": false,
  "created_at": "2026-03-07T09:00:00"
}
```
- `category`: 할일 구분용, `"중요"` / `"업무"` / `"개인"` / `"기타"` 중 하나만 가능 (다른 값이면 `422`)

### `POST /todos` — 할일 생성

요청 body:
```json
{ "title": "장보기", "memo": "우유, 계란, 식빵", "category": "개인", "due_at": "2026-03-10T18:00:00" }
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
{ "title": "장보기 (수정)", "memo": "우유는 저지방으로", "category": "개인", "due_at": "2026-03-11T18:00:00", "is_done": true }
```
- **완료 처리는 이 엔드포인트의 `is_done`으로 한다.** 완료 전용 엔드포인트는 없음.
- `is_done`을 `false → true`로 바꾸면 오늘 포인트가 10점 오른다 (`true → false`로 되돌리면 다시 10점 차감). 이 응답엔 포인트가 안 나오니, 바뀐 값은 `GET /users/me/points`로 확인.

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
- [ ] 회원가입 폼은 아이디/비밀번호만. `email`/`discord_id`/알림 말투는 별도 설정 화면에서 `PATCH /users/me`로 받는다.
- [ ] 나무/캐릭터 성장 화면은 `GET /users/me/points?period=today`의 `total` 값으로 단계(10=새싹/30=어린식물/70=나무) 판정.
