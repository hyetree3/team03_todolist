import PlantGrowth from './PlantGrowth.jsx'
import BrandLeaf from './BrandLeaf.jsx'

export default function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-intro" aria-labelledby="auth-heading">
        <div className="auth-brand" aria-label="한 잎">
          <BrandLeaf />
          <strong>한 잎</strong>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-description">{description}</p>
        <div className="auth-garden-scene" aria-hidden="true">
          <span className="auth-cloud auth-cloud-one" />
          <span className="auth-cloud auth-cloud-two" />
          <div className="auth-garden-steps">
            <span className="auth-empty-soil" />
            <PlantGrowth type="pot" stage={1} />
            <PlantGrowth type="tree" stage={3} />
          </div>
        </div>
      </section>
      <section className="auth-panel">
        {children}
        {footer}
      </section>
    </main>
  )
}
