import { clearAuth, getStoredToken } from '../utils/authStorage.js'

export const AUTH_EXPIRED_EVENT = 'auth:expired'

const getApiBaseUrl = () => {
  const value = import.meta.env.VITE_API_BASE_URL
  if (!value) {
    throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.')
  }
  return value.replace(/\/$/, '')
}

const getErrorMessage = (body, status) => {
  if (typeof body?.detail === 'string') return body.detail
  if (Array.isArray(body?.detail)) {
    return body.detail.map((item) => item.msg).filter(Boolean).join(', ') || '입력값을 확인해주세요.'
  }
  return `요청에 실패했습니다. (${status})`
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = false, headers, body, ...requestOptions } = options
  const token = auth ? getStoredToken() : null

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestOptions,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // DELETE 성공(204)처럼 응답 본문이 없는 경우 JSON 파싱을 시도하지 않는다.
  const contentType = response.headers.get('content-type') || ''
  const responseBody = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text()

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAuth()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new ApiError(getErrorMessage(responseBody, response.status), response.status, responseBody)
  }

  return responseBody
}
