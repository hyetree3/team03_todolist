import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { usePoints } from '../hooks/usePoints.js'
import PlantGrowth from '../components/PlantGrowth.jsx'
import MiniPlant from '../components/MiniPlant.jsx'
import { getGrowth } from '../components/GrowthPanel.jsx'
import { DEFAULT_PLANT_TYPE, getPlantLabel } from '../utils/plants.js'
import { hasGardenRecord } from '../utils/dailyPlants.js'

const getGardenRecord = (day, dailyPlants, today) => {
  const selectedPlantType = dailyPlants[day.date]
  const hasRecord = hasGardenRecord(day, dailyPlants)

  return {
    future: day.date > today,
    hasGardenRecord: hasRecord,
    plantType: selectedPlantType || DEFAULT_PLANT_TYPE,
    stage: getGrowth(day.points).stageIndex,
  }
}

export default function GardenPage() {
  const { todayKst: today, dailyPlantState } = useOutletContext()
  const { dailyPlants } = dailyPlantState
  const [view, setView] = useState('month')
  const { points, isLoading, error, loadPoints } = usePoints(view)
  const year = today.slice(0, 4)
  const month = Number(today.slice(5, 7))
  const months = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, days: [] }))
    ;(points?.days || []).forEach((day) => {
      const record = getGardenRecord(day, dailyPlants, today)
      result[Number(day.date.slice(5, 7)) - 1].days.push({
        ...day,
        ...record,
        state: record.future ? '아직 오지 않은 날' : record.hasGardenRecord ? `${getPlantLabel(record.plantType)}, ${day.points}P` : '식물 기록 없음',
      })
    })
    return result
  }, [dailyPlants, points, today])

  return (
    <>
      <header className="app-header page-header garden-page-header"><div><p className="eyebrow">MY GARDEN</p><h1>나의 정원</h1></div><p className="header-status">하루의 포인트가 식물로 자랍니다.</p></header>
      <div className="period-tabs garden-tabs"><button type="button" className={view === 'month' ? 'is-selected' : ''} onClick={() => setView('month')}>월 정원</button><button type="button" className={view === 'year' ? 'is-selected' : ''} onClick={() => setView('year')}>년 정원</button></div>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>정원을 가꾸는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>정원을 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadPoints}>다시 시도</button></section>}
      {!isLoading && !error && points && <>
        <section className="garden-summary"><div><p className="eyebrow">{view === 'month' ? `${year}년 ${month}월` : `${year}년`}</p><h2>{view === 'month' ? `${points.total}P의 성장 기록` : '나의 성장 기록'}</h2>{view === 'year' && <p className="year-points-note">올해 모은 {points.total}P</p>}</div>{view === 'month' && <div className="garden-legend"><span><i className="stage-0" />0P</span><span><i className="stage-1" />10P</span><span><i className="stage-2" />30P</span><span><i className="stage-3" />70P</span><span><i className="future" />아직 오지 않은 날</span></div>}</section>
        {view === 'month' ? <section className="month-garden" aria-label={`${month}월 정원`}>
          {points.days.map((day) => {
            const record = getGardenRecord(day, dailyPlants, today)
            const className = record.future ? 'is-future' : record.hasGardenRecord ? 'has-plant' : 'has-no-record'
            return <article key={day.date} className={className}>
              <time>{Number(day.date.slice(-2))}</time>
              {!record.future && record.hasGardenRecord
                ? <PlantGrowth type={record.plantType} stage={record.stage} />
                : <span className="empty-garden-plot" aria-hidden="true" />}
              <strong>{record.future ? '예정' : record.hasGardenRecord ? `${getPlantLabel(record.plantType)} · ${day.points}P` : '기록 없음'}</strong>
            </article>
          })}
        </section> : <section className="year-garden">{months.map((item) => <article key={item.month}><h2>{item.month}월</h2><div className="mini-garden">{item.days.map((day) => {
          const className = day.future ? 'is-future' : day.hasGardenRecord ? `has-plant stage-${day.stage}` : 'has-no-record'
          return <span key={day.date} title={`${day.date}: ${day.state}`} className={`mini-garden-day ${className}${day.date === today ? ' is-today' : ''}`}>
            {!day.future && day.hasGardenRecord && <MiniPlant type={day.plantType} stage={day.stage} />}
          </span>
        })}</div></article>)}</section>}
      </>}
    </>
  )
}
