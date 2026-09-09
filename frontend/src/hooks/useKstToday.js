import { useEffect, useState } from 'react'
import { getTodayKstDateKey } from '../utils/dateTime.js'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

const millisecondsUntilNextKstDay = () => {
  const shifted = new Date(Date.now() + KST_OFFSET_MS)
  shifted.setUTCHours(24, 0, 0, 100)
  return Math.max(1000, shifted.getTime() - KST_OFFSET_MS - Date.now())
}

export function useKstToday() {
  const [todayKst, setTodayKst] = useState(() => getTodayKstDateKey())

  useEffect(() => {
    let timerId
    const refresh = () => {
      setTodayKst(getTodayKstDateKey())
      timerId = window.setTimeout(refresh, millisecondsUntilNextKstDay())
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setTodayKst(getTodayKstDateKey())
    }

    timerId = window.setTimeout(refresh, millisecondsUntilNextKstDay())
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(timerId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return todayKst
}
