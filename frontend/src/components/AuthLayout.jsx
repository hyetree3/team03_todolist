export default function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-intro" aria-labelledby="auth-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-description">{description}</p>
        <div className="coming-soon">
          <span>Google Calendar</span>
          <strong>연동 예정</strong>
          <span>Discord 알림</span>
          <strong>연동 예정</strong>
        </div>
      </section>
      <section className="auth-panel">
        {children}
        {footer}
      </section>
    </main>
  )
}
