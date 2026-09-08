import { NavLink } from 'react-router-dom'
import PlantGrowth from './PlantGrowth.jsx'
import { getGrowth } from './GrowthPanel.jsx'

const navigation = [
  { to: '/', label: '오늘', end: true },
  { to: '/calendar', label: '캘린더' },
  { to: '/stats', label: '통계' },
  { to: '/garden', label: '나의 정원' },
  { to: '/settings', label: '설정' },
]

export default function AppSidebar({ username, todayPoints, todayPlant }) {
  const growth = getGrowth(todayPoints)

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true" />
          <div>
            <strong>한 잎</strong>
            <span>작은 할 일의 기록</span>
          </div>
        </div>

        <nav className="view-navigation" aria-label="주요 메뉴">
          <p>메뉴</p>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-selected' : '')}
            >
              <span className="nav-pixel" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-growth">
          {todayPlant
            ? <PlantGrowth type={todayPlant} stage={growth.stageIndex} />
            : <span className="sidebar-empty-plant" aria-hidden="true" />}
          <div>
            <span>{todayPlant ? growth.name : '오늘 식물 미선택'}</span>
            <strong>{todayPoints}P</strong>
          </div>
        </div>
        <NavLink className="sidebar-account" to="/settings">
          <span>{username}</span>
          <small>내 설정</small>
        </NavLink>
      </div>
    </aside>
  )
}
