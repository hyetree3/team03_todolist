import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { usePoints } from '../hooks/usePoints.js'
import { TODO_CATEGORIES, getTodoPreference } from '../utils/todoPreferences.js'

const PERIODS = [
  { id: 'today', label: '일' }, { id: 'week', label: '주' }, { id: 'month', label: '월' }, { id: 'year', label: '년' },
]

const chartData = (days, period) => {
  if (period !== 'year') return days.map((day) => ({ label: day.date.slice(5).replace('-', '/'), points: day.points }))
  const months = Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1}월`, points: 0 }))
  days.forEach((day) => { months[Number(day.date.slice(5, 7)) - 1].points += day.points })
  return months
}

export default function StatsPage() {
  const { todoState, preferenceState } = useOutletContext()
  const [period, setPeriod] = useState('week')
  const { points, isLoading, error, loadPoints } = usePoints(period)
  const { todos } = todoState
  const { preferences } = preferenceState
  const chart = useMemo(() => chartData(points?.days || [], period), [points, period])
  const maxPoint = Math.max(10, ...chart.map(({ points: value }) => Math.abs(value)))
  const completed = todos.filter((todo) => todo.is_done).length
  const categories = TODO_CATEGORIES.map((category) => ({
    ...category,
    count: todos.filter((todo) => getTodoPreference(preferences, todo.id).category === category.id).length,
  }))

  return (
    <>
      <header className="app-header page-header"><div><p className="eyebrow">STATISTICS</p><h1>나의 기록</h1></div><p className="header-status">포인트는 backend 기록을 사용합니다.</p></header>
      <div className="period-tabs">{PERIODS.map((item) => <button type="button" key={item.id} className={period === item.id ? 'is-selected' : ''} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>통계를 불러오는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>통계를 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadPoints}>다시 시도</button></section>}
      {!isLoading && !error && points && <>
        <section className="stat-cards">
          <article><span>획득 포인트</span><strong>{points.total}P</strong><small>{PERIODS.find((item) => item.id === period)?.label} 기준</small></article>
          <article><span>현재 완료 상태</span><strong>{completed}개</strong><small>기간별 완료 수가 아닌 현재 Todo 상태</small></article>
          <article><span>현재 등록 Todo</span><strong>{todos.length}개</strong><small>삭제되지 않은 Todo 기준</small></article>
        </section>
        <section className="stats-grid">
          <article className="stats-panel point-chart-panel"><div className="panel-title"><div><p className="eyebrow">POINT FLOW</p><h2>기간별 포인트 흐름</h2></div></div>
            <div className={`point-chart is-${period}`}>
              {chart.map((entry) => <div className="point-bar-column" key={entry.label}><span>{entry.points}</span><i className={entry.points < 0 ? 'is-negative' : ''} style={{ height: `${Math.max(3, Math.abs(entry.points) / maxPoint * 100)}%` }} /><small>{entry.label}</small></div>)}
            </div>
          </article>
          <article className="stats-panel"><div className="panel-title"><div><p className="eyebrow">CATEGORY</p><h2>현재 카테고리 구성</h2></div></div>
            <div className="category-stats">{categories.map((category) => <div key={category.id}><span><i className={`dot-${category.id}`} />{category.label}</span><strong>{category.count}</strong></div>)}</div>
            <p className="data-limit-note">카테고리는 이 브라우저의 localStorage 기준입니다. 현재 API에는 기간별 완료 시각이 없어 정확한 기간별 완료 수와 과거 카테고리 분석은 제공하지 않습니다.</p>
          </article>
        </section>
      </>}
    </>
  )
}
