import { useCallback, useEffect, useMemo, useState } from 'react'
import TodoComposer from '../components/TodoComposer.jsx'
import AppSidebar from '../components/AppSidebar.jsx'
import TodoDetailModal from '../components/TodoDetailModal.jsx'
import TodoSection from '../components/TodoSection.jsx'
import GrowthPanel from '../components/GrowthPanel.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTodoPreferences } from '../hooks/useTodoPreferences.js'
import { useTodos } from '../hooks/useTodos.js'
import { getDueDateKstKey, getTodayKstDateKey } from '../utils/dateTime.js'
import { getTodoPreference } from '../utils/todoPreferences.js'

const formatPlannerDate = (dateKey) => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date(`${dateKey}T00:00:00+09:00`))

export default function TodosPage() {
  const { username, logout } = useAuth()
  const {
    todos,
    isLoading,
    error,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    getTodo,
  } = useTodos()
  const { preferences, updatePreference, removePreference } = useTodoPreferences(username)
  const [detail, setDetail] = useState({ isOpen: false, isLoading: false, todo: null, error: '' })
  const [now, setNow] = useState(() => new Date())
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeView, setActiveView] = useState('today')
  const [showExpFeedback, setShowExpFeedback] = useState(false)
  const todayKst = getTodayKstDateKey(now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showExpFeedback) return undefined
    const timer = window.setTimeout(() => setShowExpFeedback(false), 800)
    return () => window.clearTimeout(timer)
  }, [showExpFeedback])

  const matchesCategory = useCallback((todo) => (
    categoryFilter === 'all' || getTodoPreference(preferences, todo.id).category === categoryFilter
  ), [categoryFilter, preferences])

  const todayDueTodos = useMemo(
    () => todos.filter((todo) => getDueDateKstKey(todo.due_at) === todayKst),
    [todos, todayKst],
  )
  const todayTodos = useMemo(
    () => todayDueTodos.filter((todo) => !todo.is_done && matchesCategory(todo)),
    [todayDueTodos, matchesCategory],
  )
  const otherActiveTodos = useMemo(
    () => todos.filter((todo) => !todo.is_done && getDueDateKstKey(todo.due_at) !== todayKst && matchesCategory(todo)),
    [todos, todayKst, matchesCategory],
  )
  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.is_done && matchesCategory(todo)),
    [todos, matchesCategory],
  )
  const completedCount = useMemo(() => todos.filter((todo) => todo.is_done).length, [todos])
  const activeCount = useMemo(() => todos.filter((todo) => !todo.is_done).length, [todos])
  const todayCompleted = useMemo(() => todayDueTodos.filter((todo) => todo.is_done).length, [todayDueTodos])
  const viewCounts = {
    today: todayTodos.length,
    upcoming: otherActiveTodos.length,
    completed: completedTodos.length,
  }
  const visibleSection = {
    today: {
      eyebrow: 'IN PROGRESS',
      title: '오늘의 할 일',
      todos: todayTodos,
      emptyMessage: '오늘 마감인 할 일이 없습니다.',
    },
    upcoming: {
      eyebrow: 'UPCOMING & SOMEDAY',
      title: '다른 할 일',
      todos: otherActiveTodos,
      emptyMessage: '다른 날짜의 할 일이나 마감 없는 할 일이 없습니다.',
    },
    completed: {
      eyebrow: 'COMPLETED',
      title: '완료한 일',
      todos: completedTodos,
      emptyMessage: '완료한 할 일이 아직 없습니다.',
    },
  }[activeView]

  const handleCreate = async (payload, preference) => {
    const created = await createTodo(payload)
    updatePreference(created.id, preference)
    return created
  }

  const handleUpdate = async (id, changes) => {
    const updated = await updateTodo(id, changes)
    if (changes.is_done === true) {
      setShowExpFeedback(false)
      window.requestAnimationFrame(() => setShowExpFeedback(true))
    }
    return updated
  }

  const handleDelete = async (id) => {
    await deleteTodo(id)
    removePreference(id)
  }

  const openDetail = async (id) => {
    setDetail({ isOpen: true, isLoading: true, todo: null, error: '' })
    try {
      const todo = await getTodo(id)
      setDetail({ isOpen: true, isLoading: false, todo, error: '' })
    } catch (requestError) {
      setDetail({ isOpen: true, isLoading: false, todo: null, error: requestError.message })
    }
  }

  const closeDetail = useCallback(() => {
    setDetail({ isOpen: false, isLoading: false, todo: null, error: '' })
  }, [])

  const itemActions = {
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onOpenDetail: openDetail,
    onPreferenceChange: updatePreference,
    preferences,
    now,
  }

  return (
    <div className="app-shell">
      <AppSidebar
        username={username}
        completedCount={completedCount}
        view={activeView}
        viewCounts={viewCounts}
        onViewChange={setActiveView}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onLogout={logout}
      />

      <main className="app-main">
        <header className="app-header">
          <div className="header-copy">
            <p className="planner-date">{formatPlannerDate(todayKst)}</p>
            <h1><strong>{username}</strong>님의 플래너</h1>
          </div>
          <p className="header-status">
            오늘 {todayDueTodos.length}개 <span aria-hidden="true">·</span> 진행 중 {activeCount}개 <span aria-hidden="true">·</span> 완료 {completedCount}개
          </p>
        </header>

        {!isLoading && !error && (
          <GrowthPanel
            completedCount={completedCount}
            todayTotal={todayDueTodos.length}
            todayCompleted={todayCompleted}
            showExpFeedback={showExpFeedback}
          />
        )}
        <TodoComposer onCreate={handleCreate} />

        {isLoading && (
          <section className="page-state" aria-live="polite">
            <span className="loading-mark" aria-hidden="true" />
            <p>할 일을 불러오는 중…</p>
          </section>
        )}

        {!isLoading && error && (
          <section className="page-state error-state" role="alert">
            <h2>목록을 불러오지 못했습니다.</h2>
            <p>{error}</p>
            <button type="button" onClick={loadTodos}>다시 시도</button>
          </section>
        )}

        {!isLoading && !error && todos.length === 0 && (
          <section className="page-state empty-state">
            <span className="empty-pixel-grid" aria-hidden="true" />
            <p className="eyebrow">ALL CLEAR</p>
            <h2>오늘은 아직 조용하네요.</h2>
            <p>위 작성란에서 새로운 할 일을 추가해보세요.</p>
          </section>
        )}

        {!isLoading && !error && todos.length > 0 && (
          <div className="todo-sections">
            <TodoSection {...visibleSection} {...itemActions} />
          </div>
        )}
      </main>

      {detail.isOpen && (
        <TodoDetailModal
          todo={detail.todo}
          isLoading={detail.isLoading}
          error={detail.error}
          onClose={closeDetail}
          preference={detail.todo ? getTodoPreference(preferences, detail.todo.id) : null}
        />
      )}
    </div>
  )
}
