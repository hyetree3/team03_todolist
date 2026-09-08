import { Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useDailyPlants } from '../hooks/useDailyPlants.js'
import { useKstToday } from '../hooks/useKstToday.js'
import { usePoints } from '../hooks/usePoints.js'
import { useTodoPreferences } from '../hooks/useTodoPreferences.js'
import { useTodos } from '../hooks/useTodos.js'
import { useUserProfile } from '../hooks/useUserProfile.js'
import AppSidebar from './AppSidebar.jsx'

export default function AppLayout() {
  const { username, logout } = useAuth()
  const todoState = useTodos()
  const preferenceState = useTodoPreferences(username)
  const profileState = useUserProfile()
  const todayPointState = usePoints('today')
  const todayKst = useKstToday()
  const dailyPlantState = useDailyPlants(username, todayKst)

  return (
    <div className="app-shell">
      <AppSidebar
        username={profileState.profile?.username || username}
        todayPoints={todayPointState.points?.total ?? 0}
        todayPlant={dailyPlantState.todayPlant}
      />
      <main className="app-main">
        <Outlet context={{
          username,
          logout,
          todoState,
          preferenceState,
          profileState,
          todayPointState,
          todayKst,
          dailyPlantState,
        }} />
      </main>
    </div>
  )
}
