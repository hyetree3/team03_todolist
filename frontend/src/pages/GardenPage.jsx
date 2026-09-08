import { useMemo, useState } from 'react'
import { usePoints } from '../hooks/usePoints.js'
import { getTodayKstDateKey } from '../utils/dateTime.js'
import PlantGrowth from '../components/PlantGrowth.jsx'
import { getGrowth, PLANT_TYPES } from '../components/GrowthPanel.jsx'

const plantForDate = (date) => PLANT_TYPES[(Number(date.slice(-2)) - 1) % PLANT_TYPES.length].id

export default function GardenPage() {
  const [view, setView] = useState('month')
  const { points, isLoading, error, loadPoints } = usePoints(view)
  const today = getTodayKstDateKey()
  const year = today.slice(0, 4)
  const month = Number(today.slice(5, 7))
  const months = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, days: [] }))
    ;(points?.days || []).forEach((day) => result[Number(day.date.slice(5, 7)) - 1].days.push(day))
    return result
  }, [points])

  return (
    <>
      <header className="app-header page-header"><div><p className="eyebrow">MY GARDEN</p><h1>나의 정원</h1></div><p className="header-status">하루의 포인트가 식물로 자랍니다.</p></header>
      <div className="period-tabs garden-tabs"><button type="button" className={view === 'month' ? 'is-selected' : ''} onClick={() => setView('month')}>월 정원</button><button type="button" className={view === 'year' ? 'is-selected' : ''} onClick={() => setView('year')}>년 정원</button></div>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>정원을 가꾸는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>정원을 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadPoints}>다시 시도</button></section>}
      {!isLoading && !error && points && <>
        <section className="garden-summary"><div><p className="eyebrow">{view === 'month' ? `${year}년 ${month}월` : `${year}년`}</p><h2>{points.total}P의 성장 기록</h2></div><div className="garden-legend"><span><i className="stage-0" />0P</span><span><i className="stage-1" />10P</span><span><i className="stage-2" />30P</span><span><i className="stage-3" />70P</span><span><i className="future" />아직 오지 않은 날</span></div></section>
        {view === 'month' ? <section className="month-garden" aria-label={`${month}월 정원`}>
          {points.days.map((day) => {
            const future = day.date > today
            const growth = getGrowth(day.points)
            return <article key={day.date} className={future ? 'is-future' : day.points === 0 ? 'is-empty' : ''}><time>{Number(day.date.slice(-2))}</time><PlantGrowth type={plantForDate(day.date)} stage={future ? 0 : growth.stageIndex} /><strong>{future ? '예정' : `${day.points}P`}</strong></article>
          })}
        </section> : <section className="year-garden">{months.map((item) => <article key={item.month}><h2>{item.month}월</h2><div className="mini-garden">{item.days.map((day) => { const future = day.date > today; const stage = getGrowth(day.points).stageIndex; return <span key={day.date} title={`${day.date}: ${future ? '아직 오지 않은 날' : `${day.points}P`}`} className={future ? 'is-future' : `stage-${stage}`} /> })}</div></article>)}</section>}
      </>}
    </>
  )
}
