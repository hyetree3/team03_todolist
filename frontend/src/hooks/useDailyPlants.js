import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDailyPlantStorageKey, loadDailyPlants, saveDailyPlants } from '../utils/dailyPlants.js'
import { isPlantType } from '../utils/plants.js'

export function useDailyPlants(username, todayKst) {
  const [dailyPlants, setDailyPlants] = useState(() => loadDailyPlants(username))

  useEffect(() => {
    setDailyPlants(loadDailyPlants(username))
  }, [username])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === getDailyPlantStorageKey(username)) {
        setDailyPlants(loadDailyPlants(username))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [username])

  const selectTodayPlant = useCallback((plantType) => {
    if (!username || !isPlantType(plantType)) return false

    // 다른 탭의 직전 선택도 반영한 뒤 오늘 기록이 없을 때만 한 번 저장한다.
    const latest = loadDailyPlants(username)
    if (latest[todayKst]) {
      setDailyPlants(latest)
      return false
    }

    const next = { ...latest, [todayKst]: plantType }
    if (!saveDailyPlants(username, next)) return false
    setDailyPlants(next)
    return true
  }, [todayKst, username])

  const todayPlant = dailyPlants[todayKst] || null

  return useMemo(() => ({
    dailyPlants,
    todayPlant,
    isTodaySelected: Boolean(todayPlant),
    selectTodayPlant,
  }), [dailyPlants, selectTodayPlant, todayPlant])
}
