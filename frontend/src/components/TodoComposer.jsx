import { useState } from 'react'
import { toApiKstDateTime } from '../utils/dateTime.js'

export default function TodoComposer({ onCreate }) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
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
      await onCreate({ title: trimmedTitle, due_at: toApiKstDateTime(dueAt) })
      setTitle('')
      setDueAt('')
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
        <div className="composer-field due-field">
          <label htmlFor="new-todo-due-at">마감 · KST</label>
          <input
            id="new-todo-due-at"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" disabled={isSubmitting || !title.trim()}>
          <span aria-hidden="true">＋</span>
          {isSubmitting ? '추가 중…' : '추가'}
        </button>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <p className="composer-note">마감일시는 한국시간(KST) 기준이며 선택 입력입니다.</p>
    </section>
  )
}
