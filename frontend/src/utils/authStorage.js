const TOKEN_KEY = 'team03_todo_access_token'

// 미니프로젝트의 로그인 유지 요구에 따라 localStorage를 사용한다.
// XSS가 발생하면 스크립트가 토큰을 읽을 수 있어 운영 환경의 최선의 방식은 아니다.
// 비밀번호는 어떤 경우에도 저장하지 않는다.
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)
export const storeToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearAuth = () => localStorage.removeItem(TOKEN_KEY)

export function readTokenPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export function isUsableToken(token) {
  const payload = token ? readTokenPayload(token) : null
  return Boolean(payload?.sub && payload?.exp && payload.exp * 1000 > Date.now())
}
