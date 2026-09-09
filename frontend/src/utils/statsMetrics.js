import { getGrowth } from '../components/GrowthPanel.jsx'
import { hasGardenRecord } from './dailyPlants.js'

export function buildCompletionChart(daily = [], period = 'week') {
  if (period === 'year') {
    const months = Array.from({ length: 12 }, (_, index) => ({ key: `month-${index + 1}`, label: `${index + 1}월`, count: 0 }))
    daily.forEach((day) => {
      const monthIndex = Number(day.date?.slice(5, 7)) - 1
      if (monthIndex >= 0 && monthIndex < 12) months[monthIndex].count += Number(day.count) || 0
    })
    return months
  }

  return daily.map((day) => ({
    key: day.date,
    label: period === 'today'
      ? '오늘'
      : period === 'week'
        ? day.weekday
        : `${Number(day.date.slice(8, 10))}일`,
    count: Number(day.count) || 0,
  }))
}

export function calculateGrowthRecord(days = [], today) {
  const elapsedDays = days.filter((day) => day.date <= today)
  const activityDays = elapsedDays.filter((day) => day.points > 0).length

  let longestStreak = 0
  let runningStreak = 0
  elapsedDays.forEach((day) => {
    runningStreak = day.points > 0 ? runningStreak + 1 : 0
    longestStreak = Math.max(longestStreak, runningStreak)
  })

  let currentStreak = 0
  if (elapsedDays.at(-1)?.date === today) {
    for (let index = elapsedDays.length - 1; index >= 0 && elapsedDays[index].points > 0; index -= 1) {
      currentStreak += 1
    }
  }

  return { activityDays, currentStreak, longestStreak, elapsedDayCount: elapsedDays.length }
}

export function formatChangeRate(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '비교 기록 없음'
  if (value === 0) return '지난 기간과 같아요'
  return `지난 기간보다 ${value > 0 ? '+' : ''}${value}%`
}

export function formatBusiestDay(day, period) {
  if (!day?.date || !Number.isFinite(Number(day.count))) return null
  const label = period === 'today'
    ? '오늘'
    : `${Number(day.date.slice(5, 7))}월 ${Number(day.date.slice(8, 10))}일`
  return { label, countLabel: `${day.count}개 완료` }
}

const GROWTH_STAGES = [
  { key: 'before', label: '성장 전', stageIndex: 0 },
  { key: 'sprout', label: '새싹', stageIndex: 1 },
  { key: 'young', label: '어린 식물', stageIndex: 2 },
  { key: 'full', label: '완전 성장', stageIndex: 3 },
]

const calculateDisplayRatios = (counts, totalDays) => {
  if (!totalDays) return counts.map(() => 0)

  const rawRatios = counts.map((count) => (count / totalDays) * 100)
  const ratios = rawRatios.map((ratio, index) => counts[index] ? Math.max(1, Math.floor(ratio)) : 0)
  let remainder = 100 - ratios.reduce((sum, ratio) => sum + ratio, 0)

  const addOrder = rawRatios
    .map((ratio, index) => ({ index, fraction: ratio - Math.floor(ratio) }))
    .filter(({ index }) => counts[index] > 0)
    .sort((a, b) => b.fraction - a.fraction)
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    ratios[addOrder[index % addOrder.length].index] += 1
  }
  while (remainder < 0) {
    const target = ratios.reduce((largestIndex, ratio, index) => (
      ratio > ratios[largestIndex] ? index : largestIndex
    ), 0)
    ratios[target] -= 1
    remainder += 1
  }

  return ratios
}

export function buildGrowthDistribution(days = [], today, dailyPlants = {}) {
  const recordedDays = days.filter((day) => (
    day.date && day.date <= today && hasGardenRecord(day, dailyPlants)
  ))
  const counts = GROWTH_STAGES.map(() => 0)

  recordedDays.forEach((day) => {
    const stageIndex = getGrowth(Number(day.points) || 0).stageIndex
    counts[stageIndex] += 1
  })
  const ratios = calculateDisplayRatios(counts, recordedDays.length)

  return {
    totalDays: recordedDays.length,
    stages: GROWTH_STAGES.map((stage, index) => ({
      ...stage,
      days: counts[index],
      ratio: ratios[index],
    })),
  }
}
