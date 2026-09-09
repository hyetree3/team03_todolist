# kakao 파트 — Discord 봇 + Google Calendar 알림

`E:\work\CLAUD.MD` 기준 역할 3번(재원) 담당 모듈. **backend/**, **frontend/** 폴더는 이 파트에서 건드리지 않는다.

## 📌 현재 상태 요약 (다른 세션/새로 여는 사람은 이것부터 읽을 것)

**✅ 실제 계정으로 검증 완료된 것** (전부 이 폴더 코드만으로, 독립 실행 상태에서 테스트함):
- Discord OAuth 연동 버튼 → 앱 설치 → DM 수신까지 전부 (`/start` 없이도 됨)
- Google Calendar OAuth 연동 버튼 → 실제 캘린더에 일정 생성까지
- 할일 "생성 시" 알림 + "마감 1시간 전" 정각 알림 (두 가지 다, alarm_style x category별 문구)
- 할일 삭제 시 캘린더 이벤트 자동 정리
- 카테고리(중요/업무/개인/기타)별 알림 문구 차별화

**✅ 2026-09-08 통합 완료** (backend/frontend와 하나의 사이트로 시연 가능한 상태):
- kakao의 `DATABASE_URL`을 backend의 실제 DB 파일(`E:/test/backend/app.db`)로 전환함.
- `routers/google_auth.py`, `routers/discord_auth.py`를 backend FastAPI 프로세스
  (`backend/app/routers/`)로 실제 이동함 — DB 세션도 backend의 `app.database`/`app.models`를
  쓰도록 고침. kakao 폴더에는 더 이상 이 두 라우터 파일이 없음(중복 방지, 위치만 backend로
  옮긴 것).
- **보안 보강**: 원래 `/login`이 쿼리파라미터 `user_id`를 그대로 신뢰했는데, backend로 옮기면서
  로그인한 본인(Authorization 헤더)만 자기 계정에 연동을 시작하도록 `get_current_user`
  의존성을 추가함 (다른 사람 user_id로 계정을 가로챌 수 있던 구멍을 막음).
- 콜백 성공/실패 시 JSON 대신 프론트(`FRONTEND_BASE_URL`, 기본 `/settings?connected=...`)로
  리다이렉트하도록 바꿈 — "연동 중 UI" 논의에서 미뤄뒀던 부분 중 리다이렉트 방식(B안)으로 확정.
- 프론트엔드 설정 화면의 "연동 준비 중" 버튼을 실제 연동 버튼으로 교체함
  (`frontend/src/pages/SettingsPage.jsx`, `frontend/src/api/users.js`).
- backend 스키마에 `created_notified` 컬럼 이미 존재 확인(추가 요청 불필요).
- `backend/app/main.py` import, `/auth/discord/*`·`/auth/google/*` 라우트 등록, 실제 로그인
  토큰으로 두 `/login` 엔드포인트 호출까지 curl로 end-to-end 검증 완료.

**⚠️ 남은 것**: 실제 브라우저로 Discord/Google 동의 화면까지 눌러서 콜백이 성공적으로
DB에 반영되는지는 아직 사람이 직접 눌러봐야 확인됨 (이 기기에 Node.js가 없어 frontend
dev server를 이 세션에서 직접 띄워보지 못함 — `npm install && npm run dev`로 직접 확인 필요).

**✅ 2026-09-08 추가 통합: 알림 발송 자체도 backend로 옮김 — 이 폴더는 이제 필수가 아님.**
할일이 오직 backend API(`POST /todos`)를 통해서만 생성/수정/삭제된다는 전제로, "생성 시
알림"과 "마감 1시간 전 알림"·구글 캘린더 등록/삭제를 이 폴더의 `scheduler.py`가 몇 분마다
DB를 폴링해서 알아채는 방식 대신, **backend가 할일을 만들고/고치고/지우는 바로 그 순간
직접 처리**하도록 바꿨다 (`backend/app/notifier.py`, `backend/app/notification_scheduler.py`).
- Discord DM은 discord.py의 게이트웨이 연결(이 폴더의 `discord_bot.py`) 없이, 봇 토큰으로
  REST API(`POST /users/@me/channels` → `POST /channels/{id}/messages`)를 직접 호출해서
  보낸다 (`backend/app/discord_dm.py`). 봇이 사용자 계정에 이미 설치되어 있으면(OAuth 연동
  시 `applications.commands` 스코프로 설치됨) 게이트웨이 접속 없이도 DM을 보낼 수 있다는
  점을 이용함.
- `backend/app/messages.py`, `backend/app/notifier.py`는 이 폴더의 `messages.py`/
  `notifier.py`를 그대로 이식한 것(문구/로직 동일, discord.py 대신 REST 호출로만 교체).
- `backend/app/notification_scheduler.py`가 이 폴더의 `scheduler.py`와 같은 역할(정확한
  "마감 1시간 전" 1회성 예약 + 5분 안전망 스윕 + 삭제된 할일의 캘린더 이벤트 정리)을 하되,
  "할일 생성/삭제 시점을 backend가 정확히 알고 있다"는 이점을 살려 즉시 처리하고, 폴링
  스윕은 놓친 경우에 대비한 안전망으로만 돈다.
- **이 폴더의 `python main.py`는 이제 알림 발송에 필요 없다.** 계속 켜져 있던 이유였던
  `scheduler.start_scheduler()` 호출을 `main.py`에서 제거함 — 이제 이 프로세스는 Discord
  게이트웨이 연결이 필요한 `/start` 슬래시커맨드(앱 최초 설치 보조 접점, README 아래 참고)
  용으로만 선택적으로 띄우면 된다. **backend와 이 프로세스를 동시에 켜도 중복 발송되지
  않는다** — backend가 `created_notified`/`notified` 플래그를 먼저 갱신하므로, 이 폴더의
  `scheduler.py`가 다시 켜지지 않는 한(지금은 `main.py`가 호출하지 않음) 경쟁이 생기지 않음.
- 이 폴더의 `scheduler.py`/`notifier.py`/`messages.py`/`discord_bot.py`/`google_calendar.py`/
  `crypto_utils.py` 코드 자체는 참고용으로 남아있고 삭제하지 않았다(이 폴더를 독립적으로
  다시 테스트하고 싶을 때를 위해).

**⚠️ 꼭 알아야 할 것**:
- `backend/app/models.py`의 `User`에 `calender_alarm`(철자 그대로, "calendar" 아님),
  `discord_id`, `email` 필드가 있고, kakao의 `models.py`도 여기 맞춰져 있음 — backend
  스키마가 또 바뀌면 kakao도 같이 맞춰야 함 (지금까지 여러 번 있었던 일).
- `.env`에 필요한 값들은 `env.example`(git 추적 안 됨, 아래 참고) 참고. `DISCORD_BOT_TOKEN`,
  `DISCORD_APPLICATION_ID`, `DISCORD_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `ENCRYPTION_KEY` 전부 필요.
- 상세 변경 이력은 `E:\work\kakao_session_log.md`에 시간순으로 전부 기록되어 있음.

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

두 알림 다 문구는 `user.alarm_style`(love/normal/nagging) **x** `todo.category`(중요/업무/
개인/기타)에 맞춰 `messages.py`가 랜덤으로 고른다. `alarm_style`은 할일 단위가 아니라
**계정 전체 설정**이라서, 알림이 나가기 전에 바꾸면 아직 안 나간 알림은 새 스타일로
나간다. `category`는 할일마다 다르게 지정 가능 (아래 "카테고리별 문구 차별화" 참고).

## 카테고리(중요/업무/개인/기타)별 알림 문구 차별화 (2026-09-08 추가)

`todos.category`에 **"중요"/"업무"/"개인"/"기타"** 중 하나가 한국어 문자열 그대로 들어올
예정이다 (프론트/backend에서 이 네 값 그대로 보내야 함, 다른 값이나 빈 값이면 "기타"로
취급됨). `messages.py`가 `alarm_style` x `category` 조합마다 다른 문구를 갖고 있어서,
같은 love 스타일이어도 "중요" 할일과 "개인" 할일의 알림 말투가 달라진다.

`build_message()`(마감 임박), `build_created_message()`(생성 알림) 둘 다
`(alarm_style, title, category)` 세 개를 받는다. `notifier.py`가 `todo.category`를
그대로 넘겨준다.

### 전체 문구 예시 (제목: "보고서 작성")

**할일 생성 알림**

| style \\ category | 중요 | 업무 | 개인 | 기타 |
|---|---|---|---|---|
| normal | ❗ [중요] '보고서 작성' 할일이 등록되었습니다. | 💼 [업무] '보고서 작성' 할일이 등록되었습니다. | 🏠 [개인] '보고서 작성' 할일이 등록되었습니다. | 📝 '보고서 작성' 할일이 등록되었습니다. |
| love | 💕 '보고서 작성' 중요한 일 등록했네요! 잘 챙길 수 있게 제가 도와드릴게요~ | 🥰 '보고서 작성' 업무 일정 등록 완료! 오늘도 파이팅이에요. | 💖 '보고서 작성' 등록됐어요~ 나만의 소중한 시간, 잘 챙겨봐요! | 💕 '보고서 작성' 등록 완료! 마감 다가오면 다시 알려드릴게요~ |
| nagging | 😤 '보고서 작성' 중요하다며 이제야 등록해? 미루지 말고 미리미리 좀 해. | 🙄 '보고서 작성' 업무 등록했네. 일 벌써 몇 번째 미루는 거야, 이번엔 제때 해. | 😤 '보고서 작성' 개인 일정도 이렇게 뒤늦게 등록이야? 계획적으로 좀 살아. | 😑 '보고서 작성' 등록했다고? 나중에 딴소리하지 말고 꼭 해. |

**마감 1시간 전 알림**

| style \\ category | 중요 | 업무 | 개인 | 기타 |
|---|---|---|---|---|
| normal | ❗ [중요] '보고서 작성' 마감이 1시간 남았습니다. 놓치지 않도록 주의하세요. | 💼 [업무] '보고서 작성' 마감이 1시간 남았습니다. | 🏠 [개인] '보고서 작성' 마감이 1시간 남았습니다. | 📌 '보고서 작성' 마감이 1시간 남았습니다. |
| love | 💕 '보고서 작성' 정말 중요한 일이잖아요! 마감이 1시간 남았어요, 끝까지 잘 챙겨봐요! | 🥰 '보고서 작성' 업무 마감이 1시간 남았어요. 오늘도 고생 많아요, 조금만 더 힘내요! | 💖 '보고서 작성' 마감이 1시간 남았어요~ 나를 위한 시간이니까 잊지 말고 챙겨봐요! | 💕 '보고서 작성' 마감이 1시간 남았어요! 조금만 힘내봐요, 잘 하고 있어요! |
| nagging | 🚨 야! '보고서 작성' 이거 중요하다며! 1시간밖에 안 남았는데 왜 아직도 안 끝냈어?! | 😤 '보고서 작성' 업무 마감 1시간 전이야. 일 좀 미리미리 해, 맨날 이러네. | 🙄 '보고서 작성' 개인 일정도 이렇게 미루기야? 1시간 남았다, 얼른 해. | 😑 '보고서 작성' 마감이 1시간 밖에 안 남았어. 이번엔 진짜 늦지 마. |

(각 칸에 지금은 1개씩만 있는데, 나중에 더 다양하게 하고 싶으면 `messages.py`의 해당
칸 리스트에 문구를 추가하면 랜덤으로 고르게 됨.)

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
4. ~~"Discord 연동" 버튼을 회원가입/설정 화면에 추가~~ — **2026-09-08 반영됨.** 다만
   최종 구현은 `user_id` 쿼리파라미터 방식이 아니라 로그인 토큰(Authorization 헤더)으로
   `GET /auth/discord/login`을 호출하는 방식으로 바뀜(보안 보강, 아래 참고).
5. ~~나중에 백엔드 FastAPI 앱에 합칠 때 `routers/google_auth.py`, `routers/discord_auth.py`
   두 라우터를 옮겨 넣을 것~~ — **2026-09-08 완료.** `backend/app/routers/`로 이동, DB
   세션도 backend의 `app.database`/`app.models`를 쓰도록 고침. 아래 "🔗 나중에 backend와
   합칠 때" 섹션은 이제 완료된 이력으로 남겨둠.
6. ~~회원가입 시 email/discord_id 필수 검증 재검토~~ — **해결됨.** backend가 회원가입을
   아이디/비번만 받도록 단순화하고, `email`/`discord_id`/`alarm_style`은 가입 후
   `PATCH /users/me`(`UserSettingsUpdate`)로 설정하는 방식으로 바뀜. 정확히 이 kakao 파트가
   요청했던 방향대로 반영됨.
7. ~~`todos` 테이블에 `created_notified` 컬럼 추가 요청~~ — **확인 결과 이미 반영되어 있음.**
   `backend/app/models.py`의 `Todo`에 동일한 이름/기본값(`False`)으로 이미 존재함.
8. ~~구글 캘린더 "연동 여부"를 프론트가 확인할 방법 추가~~ — **해결됨.** backend의 `User`에
   `calender_alarm: bool` 필드가 추가됨 (철자 그대로 "calender", "calendar" 아님 — 프론트
   코드에서 필드명 헷갈리지 않게 주의). `GET/PATCH /users/me` 응답에 포함되어 내려옴.
   kakao의 `routers/google_auth.py` 콜백도 연동 성공 시 이 값을 `True`로 같이 갱신하도록
   맞춰뒀다. (알림 발송 여부 자체는 여전히 `google_refresh_token_encrypted`로 판단 —
   `calender_alarm`은 프론트 표시 전용 플래그.)
9. (참고, 요청 아님) `calendar_event_logs`라는 새 테이블을 kakao가 만들어 쓰기 시작함
   (할일 삭제 시 캘린더 이벤트 정리용, 아래 "할일 삭제 시 캘린더 이벤트 자동 삭제" 참고).
   backend 코드가 이 테이블을 알 필요는 없지만, DB를 합칠 때 이 테이블도 같이 있다는 것만
   참고해달라고 알려주면 됨.

## 할일 생성 시 알림 (2026-09-08 추가)

원본 스펙에 "할일 생성 시, 마감시간 1시간 전"에 둘 다 알림을 보내라고 되어 있었는데,
그동안 "마감 1시간 전"만 구현돼 있었다. 이번에 "생성 시 알림"도 추가했다 — 위 "이 모듈이
하는 일" 섹션 참고. `models.py`의 `created_notified` 컬럼(신규, 위 7번 참고)으로 중복
발송을 막는다.

## 할일 삭제 시 캘린더 이벤트 자동 삭제 (2026-09-08 추가)

할일을 완료/취소하는 것과 별개로, 할일 자체가 **삭제**되면 그때 만들어뒀던 구글 캘린더
이벤트도 같이 지워져야 한다. 문제는 할일이 삭제되면 그 행 자체가 사라져서, "이 이벤트가
어느 할일 것이었는지" 나중에 알 방법이 없다는 것 — 그래서 이벤트를 만들 때마다
`CalendarEventLog`(`models.py`, kakao 전용 테이블)에 `todo_id`/`event_id`를 별도로
기록해둔다.

`scheduler.cleanup_deleted_todo_events()`가 스케줄러 주기마다(+봇 시작 직후 한 번 즉시)
이 로그를 훑어서, `todo_id`가 더 이상 `todos` 테이블에 없는 행을 찾으면
`google_calendar.delete_event()`로 캘린더 이벤트를 지우고 로그도 같이 지운다.

실제 계정으로 검증 완료: 할일 생성 → 캘린더 이벤트 생성 확인 → 할일 삭제 → 정리 실행 →
캘린더에서 실제로 사라지는 것까지 확인함.

**한계**: 할일이 삭제된 시점과 정리 작업이 도는 시점 사이에는 캘린더에 이벤트가 잠깐
남아있을 수 있다 (다음 주기 또는 봇 재시작 전까지, 최대 폴링 주기만큼). 즉시 반영이
꼭 필요해지면, backend의 `DELETE /todos/{id}`가 성공한 직후 kakao 쪽에 알려주는 방법을
나중에 상의해볼 수 있다 (지금은 그렇게까지 안 함).

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

`models.py`는 2026-09-08 기준으로 backend 최종 스키마(`memo`/`category`/`alarm_style`/
`google_refresh_token_encrypted`/`calender_alarm`)와 컬럼 구성을 맞춰뒀다.
`google_refresh_token_encrypted`/`calender_alarm`은 이미 `backend/app/models.py`에도 같은
이름으로 존재한다 — 더 요청할 필요 없음. (`point`는 2026-09-08에 backend가 `PointLog`라는
별도 테이블로 옮기면서 `User`에서 제거함 — kakao 알림 로직은 원래 point를 안 썼어서 여기
`models.py`에서도 그냥 삭제함.)

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
