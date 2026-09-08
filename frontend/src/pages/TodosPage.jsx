import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryFilter from '../components/CategoryFilter.jsx'
import GrowthPanel from '../components/GrowthPanel.jsx'
import TodoComposer from '../components/TodoComposer.jsx'
import TodoDetailModal from '../components/TodoDetailModal.jsx'
import TodoSection from '../components/TodoSection.jsx'
import { getDueDateKstKey, getTodayKstDateKey } from '../utils/dateTime.js'
import { getTodoPreference } from '../utils/todoPreferences.js'

const formatPlannerDate = (dateKey) => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
}).format(new Date(`${dateKey}T00:00:00+09:00`))

const views = [
  { id: 'today', label: '오늘 할 일' },
  { id: 'upcoming', label: '다가오는 일정' },
  { id: 'completed', label: '완료한 일' },
]

const belongsToToday = (todo, todayKst) => {
  const dueDate = getDueDateKstKey(todo.due_at)
  return dueDate === null || dueDate <= todayKst
}

export default function TodosPage() {
  const { username, todoState, preferenceState, todayPointState, dailyPlantState } = useOutletContext()
  const { todos, isLoading, error, loadTodos, createTodo, updateTodo, deleteTodo, getTodo } = todoState
  const { preferences, updatePreference, removePreference } = preferenceState
  const [detail, setDetail] = useState({ isOpen: false, isLoading: false, todo: null, error: '' })
  const [now, setNow] = useState(() => new Date())
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeView, setActiveView] = useState('today')
  const [showPointFeedback, setShowPointFeedback] = useState(false)
  const todayKst = getTodayKstDateKey(now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showPointFeedback) return undefined
    const timer = window.setTimeout(() => setShowPointFeedback(false), 800)
    return () => window.clearTimeout(timer)
  }, [showPointFeedback])

  const matchesCategory = useCallback((todo) => (
    categoryFilter === 'all' || getTodoPreference(preferences, todo.id).category === categoryFilter
  ), [categoryFilter, preferences])

  const todayDueTodos = useMemo(() => todos.filter((todo) => getDueDateKstKey(todo.due_at) === todayKst), [todos, todayKst])
  const todayActiveTodos = useMemo(() => todos.filter((todo) => !todo.is_done && belongsToToday(todo, todayKst)), [todos, todayKst])
  const todayTodos = useMemo(() => todayActiveTodos.filter(matchesCategory), [todayActiveTodos, matchesCategory])
  const otherActiveTodos = useMemo(() => todos.filter((todo) => !todo.is_done && !belongsToToday(todo, todayKst) && matchesCategory(todo)), [todos, todayKst, matchesCategory])
  const completedTodos = useMemo(() => todos.filter((todo) => todo.is_done && matchesCategory(todo)), [todos, matchesCategory])
  const completedCount = useMemo(() => todos.filter((todo) => todo.is_done).length, [todos])
  const activeCount = todos.length - completedCount
  const todayCompleted = useMemo(() => todayDueTodos.filter((todo) => todo.is_done).length, [todayDueTodos])

  const visibleSection = {
    today: { eyebrow: 'TODAY', title: '오늘의 할 일', todos: todayTodos, emptyMessage: '오늘 처리할 할 일이 없습니다.' },
    upcoming: { eyebrow: 'UPCOMING', title: '다가오는 일정', todos: otherActiveTodos, emptyMessage: '미래 날짜의 할 일이 없습니다.' },
    completed: { eyebrow: 'COMPLETED', title: '완료한 일', todos: completedTodos, emptyMessage: '완료한 할 일이 아직 없습니다.' },
  }[activeView]

  const handleCreate = async (payload, preference) => {
    const created = await createTodo(payload)
    updatePreference(created.id, preference)
    return created
  }

  const handleUpdate = async (id, changes) => {
    const updated = await updateTodo(id, changes)
    if (Object.hasOwn(changes, 'is_done')) {
      await todayPointState.loadPoints()
      setShowPointFeedback(false)
      window.requestAnimationFrame(() => setShowPointFeedback(true))
    }
    return updated
  }

  const handleDelete = async (id) => {
    await deleteTodo(id)
    removePreference(id)
    await todayPointState.loadPoints()
  }

  const openDetail = async (id) => {
    setDetail({ isOpen: true, isLoading: true, todo: null, error: '' })
    try {
      setDetail({ isOpen: true, isLoading: false, todo: await getTodo(id), error: '' })
    } catch (requestError) {
      setDetail({ isOpen: true, isLoading: false, todo: null, error: requestError.message })
    }
  }

  const closeDetail = useCallback(() => setDetail({ isOpen: false, isLoading: false, todo: null, error: '' }), [])
  const itemActions = { onUpdate: handleUpdate, onDelete: handleDelete, onOpenDetail: openDetail, onPreferenceChange: updatePreference, preferences, now }

  return (
    <>
      <header className="app-header">
        <div className="header-copy"><p className="planner-date">{formatPlannerDate(todayKst)}</p><h1><strong>{username}</strong>님의 오늘</h1></div>
        <p className="header-status">오늘 {todayActiveTodos.length}개 <span>·</span> 진행 중 {activeCount}개 <span>·</span> 완료 {completedCount}개</p>
      </header>

      <GrowthPanel
        points={todayPointState.points?.total ?? 0}
        isLoading={todayPointState.isLoading}
        error={todayPointState.error}
        todayTotal={todayDueTodos.length}
        todayCompleted={todayCompleted}
        showPointFeedback={showPointFeedback}
        todayPlant={dailyPlantState.todayPlant}
        onSelectPlant={dailyPlantState.selectTodayPlant}
      />
      <TodoComposer onCreate={handleCreate} />

      <div className="todo-toolbar">
        <div className="todo-view-tabs" role="tablist" aria-label="할 일 범위">
          {views.map((view) => <button key={view.id} type="button" role="tab" aria-selected={activeView === view.id} onClick={() => setActiveView(view.id)}>{view.label}</button>)}
        </div>
        <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
      </div>

      {isLoading && <section className="page-state" aria-live="polite"><span className="loading-mark" aria-hidden="true" /><p>할 일을 불러오는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state" role="alert"><h2>목록을 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadTodos}>다시 시도</button></section>}
      {!isLoading && !error && todos.length === 0 && <section className="page-state empty-state"><span className="empty-pixel-grid" aria-hidden="true" /><p className="eyebrow">ALL CLEAR</p><h2>오늘은 아직 조용하네요.</h2><p>위 작성란에서 새로운 할 일을 추가해보세요.</p></section>}
      {!isLoading && !error && todos.length > 0 && <div className="todo-sections"><TodoSection {...visibleSection} {...itemActions} /></div>}

      {detail.isOpen && <TodoDetailModal todo={detail.todo} isLoading={detail.isLoading} error={detail.error} onClose={closeDetail} preference={detail.todo ? getTodoPreference(preferences, detail.todo.id) : null} />}
    </>
  )
}
