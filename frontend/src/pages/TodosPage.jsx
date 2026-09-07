import { useCallback, useEffect, useMemo, useState } from 'react'
import TodoComposer from '../components/TodoComposer.jsx'
import TodoDetailModal from '../components/TodoDetailModal.jsx'
import TodoSection from '../components/TodoSection.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTodos } from '../hooks/useTodos.js'
import { getDueDateKstKey, getTodayKstDateKey } from '../utils/dateTime.js'

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
  const [detail, setDetail] = useState({ isOpen: false, isLoading: false, todo: null, error: '' })
  const [todayKst, setTodayKst] = useState(getTodayKstDateKey)

  useEffect(() => {
    const updateToday = () => setTodayKst(getTodayKstDateKey())
    const timer = window.setInterval(updateToday, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const todayTodos = useMemo(
    () => todos.filter((todo) => !todo.is_done && getDueDateKstKey(todo.due_at) === todayKst),
    [todos, todayKst],
  )
  const otherActiveTodos = useMemo(
    () => todos.filter((todo) => !todo.is_done && getDueDateKstKey(todo.due_at) !== todayKst),
    [todos, todayKst],
  )
  const completedTodos = useMemo(() => todos.filter((todo) => todo.is_done), [todos])

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
    onUpdate: updateTodo,
    onDelete: deleteTodo,
    onOpenDetail: openDetail,
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-copy">
          <div className="brand-label">
            <span className="pixel-brand" aria-hidden="true" />
            <p className="eyebrow">TEAM 03 · TODO LIST</p>
          </div>
          <p className="planner-date">{formatPlannerDate(todayKst)}</p>
          <h1><strong>{username}</strong>님의 플래너</h1>
        </div>
        <button type="button" className="text-button" onClick={logout}>로그아웃</button>
      </header>
      <TodoComposer onCreate={createTodo} />

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
          <TodoSection
            eyebrow="IN PROGRESS"
            title="오늘의 할 일"
            todos={todayTodos}
            emptyMessage="오늘 마감인 할 일이 없습니다."
            {...itemActions}
          />
          <TodoSection
            eyebrow="UPCOMING & SOMEDAY"
            title="다른 할 일"
            todos={otherActiveTodos}
            emptyMessage="다른 날짜의 할 일이나 마감 없는 할 일이 없습니다."
            {...itemActions}
          />
          <TodoSection
            eyebrow="COMPLETED"
            title="완료한 일"
            todos={completedTodos}
            emptyMessage="완료한 할 일이 아직 없습니다."
            {...itemActions}
          />
        </div>
      )}

      {detail.isOpen && (
        <TodoDetailModal
          todo={detail.todo}
          isLoading={detail.isLoading}
          error={detail.error}
          onClose={closeDetail}
        />
      )}
    </main>
  )
}
