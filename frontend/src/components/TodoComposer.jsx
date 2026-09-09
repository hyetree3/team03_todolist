import { useState } from 'react'
import { toApiKstDateTime } from '../utils/dateTime.js'
import { DEFAULT_TODO_PREFERENCE } from '../utils/todoPreferences.js'
import TodoOptions from './TodoOptions.jsx'

export default function TodoComposer({ onCreate }) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [category, setCategory] = useState(DEFAULT_TODO_PREFERENCE.category)
  const [color, setColor] = useState(DEFAULT_TODO_PREFERENCE.color)
  const [showOptions, setShowOptions] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('할 일을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onCreate(
        { title: trimmedTitle, due_at: toApiKstDateTime(dueAt) },
        { category, color },
      )
      setTitle('')
      setDueAt('')
      setCategory(DEFAULT_TODO_PREFERENCE.category)
      setColor(DEFAULT_TODO_PREFERENCE.color)
      setShowOptions(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="todo-composer" aria-labelledby="composer-title">
      <div className="composer-heading">
        <p className="eyebrow">빠른 추가</p>
        <h2 id="composer-title">무엇을 해야 하나요?</h2>
      </div>
      <form onSubmit={handleSubmit} className="composer-form">
        <div className="composer-quick-row">
          <div className="composer-field title-field">
            <label htmlFor="new-todo-title">할 일</label>
            <input
              id="new-todo-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
              placeholder="새 할 일을 입력하세요"
              disabled={isSubmitting}
            />
          </div>
          <button className="add-button" type="submit" disabled={isSubmitting || !title.trim()}>
            <span aria-hidden="true">＋</span>
            {isSubmitting ? '추가 중…' : '추가'}
          </button>
        </div>
        <button
          className="options-toggle"
          type="button"
          aria-expanded={showOptions}
          onClick={() => setShowOptions((current) => !current)}
        >
          <span aria-hidden="true">{showOptions ? '−' : '+'}</span>
          마감 · 분류 · 색상
        </button>
        {showOptions && (
          <div className="composer-options-panel">
            <div className="composer-field due-field">
              <label htmlFor="new-todo-due-at">마감일시 · KST</label>
              <input
                id="new-todo-due-at"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <TodoOptions
              category={category}
              color={color}
              onCategoryChange={setCategory}
              onColorChange={setColor}
            />
          </div>
        )}
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  )
}
