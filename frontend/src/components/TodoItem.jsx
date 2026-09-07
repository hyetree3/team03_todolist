import { useEffect, useState } from 'react'
import { formatDueAtKst, toApiKstDateTime, toKstDateTimeInput } from '../utils/dateTime.js'

export default function TodoItem({ todo, onUpdate, onDelete, onOpenDetail }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const [draftDueAt, setDraftDueAt] = useState(toKstDateTimeInput(todo.due_at))
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraftTitle(todo.title)
    setDraftDueAt(toKstDateTimeInput(todo.due_at))
  }, [todo.title, todo.due_at])

  const handleToggle = async () => {
    setIsUpdating(true)
    setError('')
    try {
      await onUpdate(todo.id, { is_done: !todo.is_done })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    const trimmedTitle = draftTitle.trim()
    if (!trimmedTitle) {
      setError('제목을 비워둘 수 없습니다.')
      return
    }
    const nextDueAt = toApiKstDateTime(draftDueAt)
    if (trimmedTitle === todo.title && nextDueAt === todo.due_at) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    setError('')
    try {
      await onUpdate(todo.id, { title: trimmedTitle, due_at: nextDueAt })
      setIsEditing(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')
    try {
      await onDelete(todo.id)
    } catch (requestError) {
      setError(requestError.message)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <li className={`todo-item${todo.is_done ? ' is-done' : ''}`}>
      <div className="todo-main-row">
        <button
          type="button"
          className="todo-checkbox"
          aria-label={todo.is_done ? `${todo.title} 미완료로 변경` : `${todo.title} 완료로 변경`}
          aria-pressed={todo.is_done}
          onClick={handleToggle}
          disabled={isUpdating || isDeleting}
        >
          <span aria-hidden="true">{todo.is_done ? '✓' : ''}</span>
        </button>

        <div className="todo-content">
          {isEditing ? (
            <form className="edit-form" onSubmit={handleEditSubmit}>
              <div className="edit-fields">
                <div>
                  <label htmlFor={`edit-title-${todo.id}`}>제목</label>
                  <input
                    id={`edit-title-${todo.id}`}
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    autoFocus
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-due-${todo.id}`}>마감일시 (KST)</label>
                  <input
                    id={`edit-due-${todo.id}`}
                    type="datetime-local"
                    value={draftDueAt}
                    onChange={(event) => setDraftDueAt(event.target.value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <div className="edit-actions">
                <button type="submit" disabled={isUpdating}>{isUpdating ? '저장 중…' : '저장'}</button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftTitle(todo.title)
                    setDraftDueAt(toKstDateTimeInput(todo.due_at))
                    setIsEditing(false)
                    setError('')
                  }}
                >취소</button>
              </div>
            </form>
          ) : (
            <button type="button" className="todo-title" onClick={() => onOpenDetail(todo.id)}>
              {todo.title}
            </button>
          )}
          {todo.due_at && <time className="due-hint" dateTime={todo.due_at}>{formatDueAtKst(todo.due_at)}</time>}
        </div>

        {!isEditing && (
          <div className="todo-actions">
            <button type="button" onClick={() => onOpenDetail(todo.id)}>상세</button>
            <button type="button" onClick={() => setIsEditing(true)} disabled={isUpdating || isDeleting}>수정</button>
            <button type="button" className="delete-link" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>삭제</button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm" role="alert">
          <span>이 할 일을 삭제할까요?</span>
          <button type="button" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? '삭제 중…' : '삭제'}</button>
          <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>취소</button>
        </div>
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </li>
  )
}
