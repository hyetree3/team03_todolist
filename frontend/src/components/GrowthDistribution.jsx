import { useMemo } from 'react'
import { buildGrowthDistribution } from '../utils/statsMetrics.js'

const STAGE_COLORS = {
  before: '#e4dfd2',
  sprout: '#bfd0b5',
  young: '#82a181',
  full: '#486b51',
}

const buildDonutBackground = ({ stages, totalDays }) => {
  let cursor = 0
  const segments = stages.flatMap((stage) => {
    if (!stage.days) return []
    const start = cursor
    cursor += (stage.days / totalDays) * 100
    return `${STAGE_COLORS[stage.key]} ${start}% ${cursor}%`
  })
  return `conic-gradient(${segments.join(', ')})`
}

export default function GrowthDistribution({ days = [], dailyPlants = {}, period, today }) {
  const distribution = useMemo(
    () => buildGrowthDistribution(days, today, dailyPlants),
    [dailyPlants, days, today],
  )
  const todayEntry = period === 'today' ? distribution.stages.find((stage) => stage.days > 0) : null
  const todayPoints = Number(days.find((day) => day.date === today)?.points) || 0

  if (!distribution.totalDays) {
    return (
      <section className="growth-distribution-section" aria-labelledby="growth-distribution-title">
        <div className="growth-distribution-heading">
          <div><p className="eyebrow">GROWTH DISTRIBUTION</p><h2 id="growth-distribution-title">나의 성장 분포</h2></div>
        </div>
        <p className="growth-distribution-empty">아직 성장 기록이 없어요.</p>
      </section>
    )
  }

  if (period === 'today') {
    return (
      <section className="growth-distribution-section is-today" aria-labelledby="growth-distribution-title">
        <div className="growth-distribution-heading">
          <div><p className="eyebrow">TODAY'S GROWTH</p><h2 id="growth-distribution-title">오늘의 성장 단계</h2></div>
          <p>오늘 쌓은 포인트가 만든 성장 상태예요.</p>
        </div>
        <div className="today-growth-stage">
          <i className={`growth-stage-dot is-${todayEntry.key}`} aria-hidden="true" />
          <div><span>현재 단계</span><strong>{todayEntry.label}</strong></div>
          <b>{todayPoints}P</b>
        </div>
      </section>
    )
  }

  const chartLabel = distribution.stages
    .filter((stage) => stage.days > 0)
    .map((stage) => `${stage.label} ${stage.days}일`)
    .join(', ')

  return (
    <section className="growth-distribution-section" aria-labelledby="growth-distribution-title">
      <div className="growth-distribution-heading">
        <div><p className="eyebrow">GROWTH DISTRIBUTION</p><h2 id="growth-distribution-title">나의 성장 분포</h2></div>
        <p>하루의 포인트가 도달한 성장 단계를 모았어요.</p>
      </div>
      <div className="growth-distribution-content">
        <figure className="growth-donut" style={{ background: buildDonutBackground(distribution) }} role="img" aria-label={chartLabel}>
          <figcaption><strong>{distribution.totalDays}일</strong><span>성장 기록</span></figcaption>
        </figure>
        <div className="growth-distribution-details">
          {distribution.stages.map((stage) => (
            <div key={stage.key}>
              <span><i className={`growth-stage-dot is-${stage.key}`} aria-hidden="true" />{stage.label}</span>
              <strong>{stage.days}일 <small>· {stage.ratio}%</small></strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
