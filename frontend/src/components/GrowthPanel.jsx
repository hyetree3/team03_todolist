import { useState } from 'react'
import PlantGrowth from './PlantGrowth.jsx'

export const PLANT_TYPES = [
  { id: 'pot', label: '새싹 화분' },
  { id: 'mushroom', label: '숲 버섯' },
  { id: 'tree', label: '작은 나무' },
]

export const getGrowth = (points) => {
  if (points >= 70) return { stageIndex: 3, name: '완전 성장', progress: 100, untilNext: null }
  if (points >= 30) return { stageIndex: 2, name: '어린 식물', progress: ((points - 30) / 40) * 100, untilNext: 70 - points }
  if (points >= 10) return { stageIndex: 1, name: '새싹', progress: ((points - 10) / 20) * 100, untilNext: 30 - points }
  return { stageIndex: 0, name: '성장 전', progress: Math.max(0, points) * 10, untilNext: Math.max(0, 10 - points) }
}

export default function GrowthPanel({ points, isLoading, error, todayTotal, todayCompleted, showPointFeedback }) {
  const [plantType, setPlantType] = useState('pot')
  const growth = getGrowth(points)
  const todayRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  return (
    <section className="growth-panel" aria-labelledby="growth-title">
      <div className="plant-stage">
        <PlantGrowth type={plantType} stage={growth.stageIndex} />
        <div className="plant-caption"><span>현재 단계</span><strong>{growth.name}</strong></div>
      </div>

      <div className="growth-summary">
        <p className="eyebrow">오늘의 성장</p>
        <div className="growth-heading">
          <h2 id="growth-title">{isLoading ? '…' : `${points}P`}</h2>
          <span>backend 포인트 기준</span>
        </div>
        <span className={`exp-feedback${showPointFeedback ? ' is-visible' : ''}`} aria-live="polite">
          {showPointFeedback ? '포인트 반영' : ''}
        </span>
        <div className="progress-track" aria-label={`다음 성장 진행률 ${Math.round(growth.progress)}%`}>
          <span style={{ width: `${Math.min(100, Math.max(0, growth.progress))}%` }} />
        </div>
        <p>{error || (growth.untilNext === null ? '오늘의 식물이 완전히 자랐어요.' : `다음 성장까지 ${growth.untilNext}P`)}</p>
        <div className="plant-picker" aria-label="식물 종류 선택">
          {PLANT_TYPES.map((type) => (
            <button type="button" key={type.id} className={plantType === type.id ? 'is-selected' : ''} onClick={() => setPlantType(type.id)}>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="today-progress">
        <p className="eyebrow">오늘 완료율</p>
        {todayTotal ? (
          <>
            <div className="today-progress-value"><strong>{todayCompleted} / {todayTotal}</strong><span>{todayRate}%</span></div>
            <div className="progress-track today-track" aria-label={`오늘 완료율 ${todayRate}%`}><span style={{ width: `${todayRate}%` }} /></div>
            <p>오늘 마감인 현재 할 일을 기준으로 계산해요.</p>
          </>
        ) : <p className="no-today-todos">오늘 예정된 할 일이 아직 없어요.</p>}
      </div>
    </section>
  )
}
