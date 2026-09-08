import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getDueDateKstKey, getTodayKstDateKey, toKstDateTimeInput } from '../utils/dateTime.js'
import { getCategoryLabel, getTodoPreference } from '../utils/todoPreferences.js'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const monthCells = (year, month) => {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const lastDate = new Date(year, month, 0).getDate()
  return [...Array(firstDay).fill(null), ...Array.from({ length: lastDate }, (_, index) => index + 1)]
}

const dateKey = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export default function CalendarPage() {
  const { todoState, preferenceState, todayPointState } = useOutletContext()
  const { todos, isLoading, error, loadTodos, updateTodo } = todoState
  const { preferences } = preferenceState
  const today = getTodayKstDateKey()
  const [todayYear, todayMonth] = today.split('-').map(Number)
  const [visibleMonth, setVisibleMonth] = useState({ year: todayYear, month: todayMonth })
  const [selectedDate, setSelectedDate] = useState(today)
  const [updatingId, setUpdatingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const groupedTodos = useMemo(() => todos.reduce((groups, todo) => {
    const key = getDueDateKstKey(todo.due_at)
    if (!key) return groups
    return { ...groups, [key]: [...(groups[key] || []), todo] }
  }, {}), [todos])

  const moveMonth = (amount) => {
    const next = new Date(visibleMonth.year, visibleMonth.month - 1 + amount, 1)
    const year = next.getFullYear()
    const month = next.getMonth() + 1
    setVisibleMonth({ year, month })
    setSelectedDate(dateKey(year, month, 1))
  }

  const goToday = () => {
    setVisibleMonth({ year: todayYear, month: todayMonth })
    setSelectedDate(today)
  }

  const handleToggle = async (todo) => {
    setUpdatingId(todo.id)
    setActionError('')
    try {
      await updateTodo(todo.id, { is_done: !todo.is_done })
      await todayPointState.loadPoints()
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedTodos = groupedTodos[selectedDate] || []

  return (
    <>
      <header className="app-header page-header"><div><p className="eyebrow">CALENDAR</p><h1>캘린더</h1></div><p className="header-status">모든 날짜는 KST 기준입니다.</p></header>
      {isLoading && <section className="page-state"><span className="loading-mark" /><p>일정을 불러오는 중…</p></section>}
      {!isLoading && error && <section className="page-state error-state"><h2>캘린더를 불러오지 못했습니다.</h2><p>{error}</p><button type="button" onClick={loadTodos}>다시 시도</button></section>}
      {!isLoading && !error && (
        <div className="calendar-layout">
          <section className="calendar-card">
            <div className="calendar-controls">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">‹</button>
              <h2>{visibleMonth.year}년 {visibleMonth.month}월</h2>
              <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">›</button>
              <button type="button" className="today-button" onClick={goToday}>오늘</button>
            </div>
            <div className="calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid">
              {monthCells(visibleMonth.year, visibleMonth.month).map((day, index) => {
                if (!day) return <span className="calendar-blank" key={`blank-${index}`} />
                const key = dateKey(visibleMonth.year, visibleMonth.month, day)
                const dateTodos = groupedTodos[key] || []
                return (
                  <button type="button" key={key} className={`${key === selectedDate ? 'is-selected ' : ''}${key === today ? 'is-today' : ''}`} onClick={() => setSelectedDate(key)}>
                    <span>{day}</span>
                    <span className="calendar-dots" aria-label={dateTodos.length ? `할 일 ${dateTodos.length}개` : '할 일 없음'}>
                      {dateTodos.slice(0, 4).map((todo) => <i key={todo.id} className={`dot-${getTodoPreference(preferences, todo.id).category}`} />)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="selected-day-panel">
            <p className="eyebrow">SELECTED DATE</p><h2>{selectedDate.replaceAll('-', '. ')}</h2>
            {actionError && <p className="inline-error" role="alert">{actionError}</p>}
            {selectedTodos.length === 0 ? <p className="muted-message">이 날짜에 마감인 할 일이 없습니다.</p> : (
              <ul className="calendar-todo-list">
                {selectedTodos.map((todo) => {
                  const preference = getTodoPreference(preferences, todo.id)
                  return <li key={todo.id} className={todo.is_done ? 'is-done' : ''}>
                    <button type="button" className="todo-checkbox" aria-pressed={todo.is_done} disabled={updatingId === todo.id} onClick={() => handleToggle(todo)}><span>{todo.is_done ? '✓' : ''}</span></button>
                    <div><strong>{todo.title}</strong><span>{getCategoryLabel(preference.category)} · {toKstDateTimeInput(todo.due_at).slice(11, 16)}</span></div>
                  </li>
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
