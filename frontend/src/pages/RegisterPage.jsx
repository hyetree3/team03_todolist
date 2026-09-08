import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../api/auth.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

const initialForm = { username: '', password: '' }

export default function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleChange = (event) => {
    setError('')
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await register(form)
      navigate('/login', { replace: true, state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' } })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="TEAM 03 · TODO LIST"
      title={<>작은 할 일부터,<br />한 잎씩 차근차근.</>}
      description="계정을 만들고 나만의 Todo 공간을 시작하세요."
      footer={<p className="auth-footer">이미 계정이 있나요? <Link to="/login">로그인</Link></p>}
    >
      <div className="panel-heading">
        <p className="eyebrow">GET STARTED</p>
        <h2>회원가입</h2>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="username">아이디</label>
        <input id="username" name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? '가입 중…' : '계정 만들기'}</button>
      </form>
    </AuthLayout>
  )
}
