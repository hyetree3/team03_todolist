import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import GardenPage from './pages/GardenPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import StatsPage from './pages/StatsPage.jsx'
import TodosPage from './pages/TodosPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TodosPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/garden" element={<GardenPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
