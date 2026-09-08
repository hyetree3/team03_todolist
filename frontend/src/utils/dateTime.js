const KST_TIME_ZONE = 'Asia/Seoul'

const hasExplicitOffset = (value) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)

const getKstParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

const formatParts = ({ year, month, day, hour, minute }) => (
  `${year}. ${month}. ${day}. ${hour}:${minute} KST`
)

export function getTodayKstDateKey(now = new Date()) {
  const { year, month, day } = getKstParts(now)
  return `${year}-${month}-${day}`
}

export function getDueDateKstKey(value) {
  if (!value) return null
  if (!hasExplicitOffset(value)) return value.slice(0, 10)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const { year, month, day } = getKstParts(date)
  return `${year}-${month}-${day}`
}

export function isDueTodayKst(value, now = new Date()) {
  return getDueDateKstKey(value) === getTodayKstDateKey(now)
}

export function toKstDateTimeInput(value) {
  if (!value) return ''
  if (!hasExplicitOffset(value)) return value.slice(0, 16)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const { year, month, day, hour, minute } = getKstParts(date)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function toApiKstDateTime(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

export function formatDueAtKst(value) {
  if (!value) return '설정하지 않음'

  if (hasExplicitOffset(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : formatParts(getKstParts(date))
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return value
  const [, year, month, day, hour, minute] = match
  return formatParts({ year, month, day, hour, minute })
}

const getDueInstant = (value) => {
  if (!value) return null
  const normalized = hasExplicitOffset(value) ? value : `${value.slice(0, 19)}+09:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getDueStatusKst(value, now = new Date()) {
  if (!value) return null

  const inputValue = toKstDateTimeInput(value)
  const primary = getDueDateKstKey(value) === getTodayKstDateKey(now)
    ? `오늘 ${inputValue.slice(11, 16)}`
    : formatDueAtKst(value)
  const dueInstant = getDueInstant(value)

  if (!dueInstant) return { primary, secondary: '', tone: 'normal' }

  const minutesLeft = Math.ceil((dueInstant.getTime() - now.getTime()) / 60_000)
  if (minutesLeft <= 0) return { primary, secondary: '마감 지남', tone: 'overdue' }
  if (minutesLeft > 120) return { primary, secondary: '', tone: 'normal' }

  const hours = Math.floor(minutesLeft / 60)
  const minutes = minutesLeft % 60
  const secondary = hours
    ? `${hours}시간${minutes ? ` ${minutes}분` : ''} 남음`
    : `${minutes}분 남음`

  return { primary, secondary, tone: minutesLeft <= 30 ? 'urgent' : 'soon' }
}

export function formatCreatedAtKst(value) {
  if (!value) return '-'

  // 최신 backend의 offset 없는 created_at은 이미 KST 벽시계 값이다.
  if (!hasExplicitOffset(value)) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (!match) return value
    const [, year, month, day, hour, minute] = match
    return formatParts({ year, month, day, hour, minute })
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : formatParts(getKstParts(date))
}
