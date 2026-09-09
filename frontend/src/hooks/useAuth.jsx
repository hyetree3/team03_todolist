import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_EXPIRED_EVENT } from '../api/client.js'
import { login as requestLogin } from '../api/auth.js'
import {
  clearAuth,
  getStoredToken,
  isUsableToken,
  readTokenPayload,
  storeToken,
} from '../utils/authStorage.js'

const AuthContext = createContext(null)

const getInitialAuth = () => {
  const token = getStoredToken()
  if (!isUsableToken(token)) {
    clearAuth()
    return null
  }
  return { token, username: readTokenPayload(token).sub }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth)
  const [sessionMessage, setSessionMessage] = useState('')

  useEffect(() => {
    const handleExpired = () => {
      setAuth(null)
      setSessionMessage('로그인이 만료되었습니다. 다시 로그인해주세요.')
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [])

  const login = async (credentials) => {
    const response = await requestLogin(credentials)
    storeToken(response.access_token)
    setAuth({
      token: response.access_token,
      username: readTokenPayload(response.access_token)?.sub || credentials.username,
    })
    setSessionMessage('')
  }

  const logout = () => {
    clearAuth()
    setAuth(null)
    setSessionMessage('')
  }

  const value = useMemo(() => ({
    isAuthenticated: Boolean(auth),
    username: auth?.username || '',
    sessionMessage,
    clearSessionMessage: () => setSessionMessage(''),
    login,
    logout,
  }), [auth, sessionMessage])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  return context
}
