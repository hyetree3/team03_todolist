import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { disconnectDiscord, disconnectGoogle, getDiscordAuthUrl, getGoogleAuthUrl } from '../api/users.js'

const ALARM_STYLES = [
  { id: 'normal', label: '기본', description: '차분하고 간결하게 알려드려요.' },
  { id: 'nagging', label: '잔소리', description: '놓치지 않도록 조금 더 적극적으로 알려드려요.' },
  { id: 'love', label: '사랑', description: '다정하고 응원하는 말투로 알려드려요.' },
]

const CONNECTION_LABELS = { discord: 'Discord', google: 'Google Calendar' }

export default function SettingsPage() {
  const { logout, profileState } = useOutletContext()
  const { profile, isLoading, error, loadProfile, updateProfile } = profileState
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [connectingTarget, setConnectingTarget] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // Discord/Google 연동 버튼 클릭 -> OAuth 인증 화면 -> 콜백이 여기(?connected=&status=)로
  // 다시 리다이렉트시킴. 그 결과를 메시지로 보여주고 최신 연동 상태를 다시 불러온다.
  useEffect(() => {
    const connected = searchParams.get('connected')
    const status = searchParams.get('status')
    if (!connected) return

    const label = CONNECTION_LABELS[connected] || connected
    setMessage(status === 'success' ? `${label} 연동이 완료되었습니다.` : `${label} 연동에 실패했습니다. 다시 시도해주세요.`)
    if (status === 'success') loadProfile()
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, loadProfile])

  const setAlarmStyle = async (alarmStyle) => {
    setIsSaving(true)
    setMessage('')
    try {
      await updateProfile({ alarm_style: alarmStyle })
      setMessage('알림 말투를 저장했습니다.')
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const startConnection = async (target, getAuthUrl) => {
    setConnectingTarget(target)
    setMessage('')
    try {
      const { auth_url: authUrl } = await getAuthUrl()
      window.location.href = authUrl
    } catch (requestError) {
      setMessage(requestError.message)
      setConnectingTarget('')
    }
  }

  const startDisconnect = async (target, disconnect) => {
    const label = CONNECTION_LABELS[target] || target
    setConnectingTarget(`${target}-disconnect`)
    setMessage('')
    try {
      await disconnect()
      await loadProfile()
      setMessage(`${label} 연동을 해제했습니다.`)
    } catch (requestError) {
      setMessage(requestError.message)
    } finally {
      setConnectingTarget('')
    }
  }

  return (
    <>
      <header className="app-header page-header"><div><p className="eyebrow">SETTINGS</p><h1>설정</h1></div><p className="header-status">계정과 알림을 관리합니다.</p></header>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>설정을 불러오는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>사용자 정보를 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadProfile}>다시 시도</button></section>}
      {!isLoading && profile && <div className="settings-stack">
        <section className="settings-panel"><div className="panel-title"><div><p className="eyebrow">ACCOUNT</p><h2>계정</h2></div><span>사용자 #{profile.id}</span></div><dl className="account-details"><div><dt>아이디</dt><dd>{profile.username}</dd></div><div><dt>이메일</dt><dd>{profile.email || '등록되지 않음'}</dd></div></dl></section>
        <section className="settings-panel"><div className="panel-title"><div><p className="eyebrow">NOTIFICATION TONE</p><h2>알림 말투</h2></div></div><div className="alarm-options">{ALARM_STYLES.map((style) => <button type="button" key={style.id} className={profile.alarm_style === style.id ? 'is-selected' : ''} disabled={isSaving} onClick={() => setAlarmStyle(style.id)}><strong>{style.label}</strong><span>{style.description}</span></button>)}</div></section>
        <section className="settings-panel"><div className="panel-title"><div><p className="eyebrow">CONNECTIONS</p><h2>외부 서비스 연동</h2></div></div><div className="connection-list">
          <div>
            <span><strong>Discord</strong><small>{profile.discord_id ? '연동 정보 있음' : '연동되지 않음'}</small></span>
            <div className="connection-actions">
              <button type="button" disabled={connectingTarget !== ''} onClick={() => startConnection('discord', getDiscordAuthUrl)}>{connectingTarget === 'discord' ? '이동 중…' : profile.discord_id ? '다시 연동' : '연동하기'}</button>
              {profile.discord_id && <button type="button" className="danger" disabled={connectingTarget !== ''} onClick={() => startDisconnect('discord', disconnectDiscord)}>{connectingTarget === 'discord-disconnect' ? '해제 중…' : '연동 취소'}</button>}
            </div>
          </div>
          <div>
            <span><strong>Google Calendar</strong><small>{profile.calender_alarm ? '연동 정보 있음' : '연동되지 않음'}</small></span>
            <div className="connection-actions">
              <button type="button" disabled={connectingTarget !== ''} onClick={() => startConnection('google', getGoogleAuthUrl)}>{connectingTarget === 'google' ? '이동 중…' : profile.calender_alarm ? '다시 연동' : '연동하기'}</button>
              {profile.calender_alarm && <button type="button" className="danger" disabled={connectingTarget !== ''} onClick={() => startDisconnect('google', disconnectGoogle)}>{connectingTarget === 'google-disconnect' ? '해제 중…' : '연동 취소'}</button>}
            </div>
          </div>
        </div></section>
        {message && <p className="settings-message" role="status">{message}</p>}
        <section className="settings-panel logout-panel"><div><p className="eyebrow">SESSION</p><h2>로그아웃</h2><p>이 브라우저에 저장된 로그인 토큰을 삭제합니다.</p></div><button type="button" onClick={logout}>로그아웃</button></section>
      </div>}
    </>
  )
}
