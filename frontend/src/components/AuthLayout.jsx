import PlantGrowth from './PlantGrowth.jsx'

export default function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-intro" aria-labelledby="auth-heading">
        <div className="auth-brand" aria-label="한 잎">
          <span className="auth-brand-mark" aria-hidden="true" />
          <strong>한 잎</strong>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-description">{description}</p>
        <div className="auth-garden-scene" aria-hidden="true">
          <span className="auth-cloud auth-cloud-one" />
          <span className="auth-cloud auth-cloud-two" />
          <span className="auth-scene-ground" />
          <PlantGrowth type="tree" stage={1} />
          <span className="auth-scene-stone" />
        </div>
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
