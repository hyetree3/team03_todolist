import CategoryFilter from './CategoryFilter.jsx'
import PlantGrowth from './PlantGrowth.jsx'
import { getGrowth } from './GrowthPanel.jsx'

const views = [
  { id: 'today', label: '오늘' },
  { id: 'upcoming', label: '다른 할 일' },
  { id: 'completed', label: '완료한 일' },
]

export default function AppSidebar({
  username,
  completedCount,
  view,
  viewCounts,
  onViewChange,
  category,
  onCategoryChange,
  onLogout,
}) {
  const exp = completedCount * 10
  const growth = getGrowth(exp)

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

        <nav className="view-navigation" aria-label="할 일 목록">
          <p>플래너</p>
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'is-selected' : ''}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => onViewChange(item.id)}
            >
              <span className="nav-pixel" aria-hidden="true" />
              {item.label}
              <small>{viewCounts[item.id]}</small>
            </button>
          ))}
        </nav>

        <CategoryFilter value={category} onChange={onCategoryChange} />
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-growth">
          <PlantGrowth stage={growth.stageIndex} />
          <div>
            <span>{growth.name}</span>
            <strong>{exp} EXP</strong>
          </div>
        </div>
        <div className="sidebar-account">
          <span>{username}</span>
          <button type="button" onClick={onLogout}>로그아웃</button>
        </div>
      </div>
    </aside>
  )
}
