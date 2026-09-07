import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const { isAuthenticated, login, sessionMessage, clearSessionMessage } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleChange = (event) => {
    clearSessionMessage()
    setError('')
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const notice = location.state?.message || sessionMessage

  return (
    <AuthLayout
      eyebrow="TEAM 03 · TODO LIST"
      title="할 일을 선명하게, 하루를 가볍게."
      description="로그인하고 오늘 해야 할 일을 한곳에서 관리하세요."
      footer={<p className="auth-footer">처음이신가요? <Link to="/register">회원가입</Link></p>}
    >
      <div className="panel-heading">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>로그인</h2>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="username">아이디</label>
        <input id="username" name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? '로그인 중…' : '로그인'}</button>
      </form>
    </AuthLayout>
  )
}
