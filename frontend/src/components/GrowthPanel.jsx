import PlantGrowth from './PlantGrowth.jsx'

const GROWTH_STAGES = [
  { min: 0, max: 20, name: '씨앗' },
  { min: 20, max: 50, name: '새싹' },
  { min: 50, max: 90, name: '어린 식물' },
  { min: 90, max: 140, name: '성장한 식물' },
  { min: 140, max: null, name: '꽃이 핀 식물' },
]

export const getGrowth = (exp) => {
  const stageIndex = GROWTH_STAGES.findIndex(({ min, max }) => exp >= min && (max === null || exp < max))
  const stage = GROWTH_STAGES[stageIndex]
  const progress = stage.max === null ? 100 : ((exp - stage.min) / (stage.max - stage.min)) * 100
  return {
    stageIndex,
    name: stage.name,
    progress,
    untilNext: stage.max === null ? null : stage.max - exp,
  }
}

export default function GrowthPanel({ completedCount, todayTotal, todayCompleted, showExpFeedback }) {
  const exp = completedCount * 10
  const growth = getGrowth(exp)
  const todayRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  return (
    <section className="growth-panel" aria-labelledby="growth-title">
      <div className="plant-stage">
        <PlantGrowth stage={growth.stageIndex} />
        <div className="plant-caption">
          <span>현재 단계</span>
          <strong>{growth.name}</strong>
        </div>
      </div>

      <div className="growth-summary">
        <p className="eyebrow">오늘의 성장</p>
        <div className="growth-heading">
          <h2 id="growth-title">{exp} EXP</h2>
          <span>완료 {completedCount}개</span>
        </div>
        <span className={`exp-feedback${showExpFeedback ? ' is-visible' : ''}`} aria-live="polite">
          {showExpFeedback ? '+10 EXP' : ''}
        </span>
        <div className="progress-track" aria-label={`성장 진행률 ${Math.round(growth.progress)}%`}>
          <span style={{ width: `${growth.progress}%` }} />
        </div>
        <p>{growth.untilNext === null ? '가장 크게 성장했어요.' : `다음 성장까지 ${growth.untilNext} EXP`}</p>
      </div>

      <div className="today-progress">
        <p className="eyebrow">오늘 완료율</p>
        {todayTotal ? (
          <>
            <div className="today-progress-value"><strong>{todayCompleted} / {todayTotal}</strong><span>{todayRate}%</span></div>
            <div className="progress-track today-track" aria-label={`오늘 완료율 ${todayRate}%`}>
              <span style={{ width: `${todayRate}%` }} />
            </div>
            <p>오늘 마감인 할 일을 기준으로 계산해요.</p>
          </>
        ) : (
          <p className="no-today-todos">오늘 예정된 할 일이 아직 없어요.</p>
        )}
      </div>
    </section>
  )
}
