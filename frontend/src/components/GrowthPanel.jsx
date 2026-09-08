import { getPlantLabel, PLANT_TYPES } from '../utils/plants.js'
import PlantGrowth from './PlantGrowth.jsx'

export const getGrowth = (points) => {
  if (points >= 70) return { stageIndex: 3, name: '완전 성장', progress: 100, nextTarget: null }
  if (points >= 30) return { stageIndex: 2, name: '어린 식물', progress: ((points - 30) / 40) * 100, nextTarget: 70 }
  if (points >= 10) return { stageIndex: 1, name: '새싹', progress: ((points - 10) / 20) * 100, nextTarget: 30 }
  return { stageIndex: 0, name: '성장 전', progress: Math.max(0, points) * 10, nextTarget: 10 }
}

export default function GrowthPanel({
  points,
  isLoading,
  error,
  todayTotal,
  todayCompleted,
  isTodayDueComplete,
  showPointFeedback,
  todayPlant,
  onSelectPlant,
}) {
  const growth = getGrowth(points)
  const todayRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0

  return (
    <section className={`growth-panel${todayPlant ? ' has-daily-plant' : ' needs-daily-plant'}`} aria-labelledby="growth-title">
      <div className="plant-stage">
        {todayPlant ? (
          <>
            <PlantGrowth type={todayPlant} stage={growth.stageIndex} />
            <div className="plant-caption"><span>오늘의 식물</span><strong>{getPlantLabel(todayPlant)}</strong></div>
          </>
        ) : (
          <div className="unselected-plant" aria-hidden="true"><span>?</span></div>
        )}
        {isTodayDueComplete && (
          <span className="completion-sparkles" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>

      <div className="growth-summary">
        <p className="eyebrow">오늘의 성장</p>
        {todayPlant ? (
          <>
            <div className="growth-heading">
              <h2 id="growth-title">{isLoading ? '…' : `${points}P`}</h2>
              <span>현재 단계 · {growth.name}</span>
            </div>
            <span className={`exp-feedback${showPointFeedback ? ' is-visible' : ''}`} aria-live="polite">{showPointFeedback ? '포인트 반영' : ''}</span>
            <div className="progress-track" aria-label={`다음 성장 진행률 ${Math.round(growth.progress)}%`}><span style={{ width: `${Math.min(100, Math.max(0, growth.progress))}%` }} /></div>
            <p>{error || (growth.nextTarget === null ? '오늘의 식물이 완전히 자랐어요.' : `다음 성장 · ${growth.nextTarget}P`)}</p>
            <p className="plant-lock-note">오늘 선택한 식물은 KST 자정까지 변경할 수 없어요.</p>
          </>
        ) : (
          <>
            <h2 id="growth-title" className="plant-choice-title">오늘 키울 식물을 골라주세요</h2>
            <p className="unselected-points">현재 포인트 {isLoading ? '확인 중…' : `${points}P`} · 선택하면 현재 단계가 바로 반영됩니다.</p>
            {error && <p className="inline-error">{error}</p>}
            <div className="daily-plant-picker" aria-label="오늘 키울 식물 선택">
              {PLANT_TYPES.map((type) => (
                <button type="button" key={type.id} onClick={() => onSelectPlant(type.id)}>
                  <PlantGrowth type={type.id} stage={2} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
            <p className="selection-warning">하루에 한 번만 선택할 수 있어요.</p>
          </>
        )}
        {isTodayDueComplete && <p className="today-complete-message">오늘 마감 할 일을 모두 완료했어요.</p>}
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
