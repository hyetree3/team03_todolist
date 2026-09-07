# Todo List 프론트엔드

## 실행

```bash
cp .env.example .env
npm install
npm run dev
```

백엔드는 기본 예시 기준 `http://localhost:8000`에서 별도로 실행해야 합니다.

## 환경변수

- `VITE_API_BASE_URL`: FastAPI 서버 주소

`VITE_`로 시작하는 값은 브라우저 번들에 포함됩니다. 비밀키, 비밀번호, JWT secret을 넣으면 안 됩니다.

현재 로그인 토큰은 3일짜리 미니프로젝트 범위에 맞춰 `localStorage`에 저장합니다. 페이지를 새로 열어도 로그인이 유지되는 장점이 있지만, XSS가 발생하면 브라우저 스크립트가 토큰에 접근할 수 있으므로 운영 서비스의 최선의 방식은 아닙니다. 실제 비밀번호는 저장하지 않습니다.
