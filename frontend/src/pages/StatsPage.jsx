import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { usePoints } from '../hooks/usePoints.js'
import { useTodoStats } from '../hooks/useTodoStats.js'
import GrowthDistribution from '../components/GrowthDistribution.jsx'
import {
  buildCompletionChart,
  calculateGrowthRecord,
  formatBusiestDay,
  formatChangeRate,
} from '../utils/statsMetrics.js'

const PERIODS = [
  { id: 'today', label: '일', context: '오늘' },
  { id: 'week', label: '주', context: '이번 주' },
  { id: 'month', label: '월', context: '이번 달' },
  { id: 'year', label: '년', context: '올해' },
]

export default function StatsPage() {
  const { todayKst, dailyPlantState } = useOutletContext()
  const [period, setPeriod] = useState('week')
  const { stats, isLoading: isStatsLoading, error: statsError, loadStats } = useTodoStats(period)
  const { points, isLoading: isPointsLoading, error: pointsError, loadPoints } = usePoints(period)

  const chart = useMemo(() => buildCompletionChart(stats?.daily, period), [period, stats?.daily])
  const growthRecord = useMemo(
    () => calculateGrowthRecord(points?.days, todayKst),
    [points?.days, todayKst],
  )
  const busiestDay = formatBusiestDay(stats?.busiest_day, period)
  const periodContext = PERIODS.find((item) => item.id === period)?.context
  const maxCount = Math.max(1, ...chart.map(({ count }) => count))
  const isLoading = isStatsLoading || isPointsLoading
  const error = statsError || pointsError

  const retry = () => {
    loadStats()
    loadPoints()
  }

  return (
    <>
      <header className="app-header page-header"><div><p className="eyebrow">STATISTICS</p><h1>나의 기록</h1></div><p className="header-status">DB에 쌓인 성장 기록을 모아 보여드려요.</p></header>
      <div className="period-tabs">{PERIODS.map((item) => <button type="button" key={item.id} className={period === item.id ? 'is-selected' : ''} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>통계를 불러오는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>통계를 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={retry}>다시 시도</button></section>}
      {!isLoading && !error && stats && points && <>
        <section className="stat-cards stats-summary" aria-label={`${periodContext} 요약`}>
          <article>
            <span>완료 활동</span>
            <strong>{stats.completed_count}회</strong>
            <small>{formatChangeRate(stats.completed_count_change_pct)}</small>
          </article>
          <article>
            <span>획득 포인트</span>
            <strong>{stats.points_total}P</strong>
            <small>{formatChangeRate(stats.points_change_pct)}</small>
          </article>
          <article>
            <span>가장 많이 해낸 날</span>
            <strong className={busiestDay ? '' : 'empty-stat-value'}>{busiestDay?.label || '아직 기록이 없어요'}</strong>
            <small>{busiestDay?.countLabel || `${periodContext} 첫 기록을 기다리고 있어요.`}</small>
          </article>
        </section>

        <section className="stats-grid">
          <article className="stats-panel point-chart-panel">
            <div className="panel-title"><div><p className="eyebrow">ACTIVITY FLOW</p><h2>완료 활동의 흐름</h2></div><span>{stats.range.start} – {stats.range.end}</span></div>
            <div className={`point-chart activity-chart is-${period}`}>
              {chart.map((entry) => <div className="point-bar-column" key={entry.key}><span>{entry.count}</span><i style={{ height: entry.count ? `${Math.max(5, entry.count / maxCount * 100)}%` : 0 }} /><small>{entry.label}</small></div>)}
            </div>
            <p className="stats-source-note">완료 처리 이벤트 기록을 기준으로 보여드려요.</p>
          </article>

          <article className="stats-panel growth-record-panel">
            <div className="panel-title"><div><p className="eyebrow">GROWTH RECORD</p><h2>성장 기록</h2></div></div>
            <dl className="growth-record-list">
              <div><dt>활동한 날</dt><dd>{growthRecord.activityDays}일</dd></div>
              <div><dt>현재 연속 성장</dt><dd>{growthRecord.currentStreak}일</dd></div>
              <div><dt>최장 연속 성장</dt><dd>{growthRecord.longestStreak}일</dd></div>
            </dl>
            <p className="growth-record-note">{periodContext} {growthRecord.elapsedDayCount}일 중 {growthRecord.activityDays}일 동안 정원을 가꿨어요.</p>
          </article>
        </section>
        <GrowthDistribution days={points.days} dailyPlants={dailyPlantState.dailyPlants} period={period} today={todayKst} />
      </>}
    </>
  )
}
