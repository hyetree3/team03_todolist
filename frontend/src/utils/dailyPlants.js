import { isPlantType } from './plants.js'

const getStorageKey = (username) => `daily_plant_${username}`

export function loadDailyPlants(username) {
  if (!username) return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(getStorageKey(username)) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(([date, plantType]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && isPlantType(plantType)),
    )
  } catch {
    return {}
  }
}

export function saveDailyPlants(username, dailyPlants) {
  if (!username) return false
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(dailyPlants))
    return true
  } catch {
    // 저장소가 차단되어도 Todo와 포인트 기능은 계속 사용할 수 있다.
    return false
  }
}

export function getDailyPlantStorageKey(username) {
  return getStorageKey(username)
}

export function hasGardenRecord(day, dailyPlants = {}) {
  return Number(day?.points) > 0 || Boolean(day?.date && dailyPlants[day.date])
}
