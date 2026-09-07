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

export function formatCreatedAtKst(value) {
  if (!value) return '-'

  // 현재 백엔드는 created_at을 UTC 기준의 offset 없는 문자열로 생성한다.
  const instantValue = hasExplicitOffset(value) ? value : `${value}Z`
  const date = new Date(instantValue)
  return Number.isNaN(date.getTime()) ? value : formatParts(getKstParts(date))
}
