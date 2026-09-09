import { useEffect } from 'react'
import { formatCreatedAtKst, formatDueAtKst } from '../utils/dateTime.js'
import { getCategoryLabel, getColorValue } from '../utils/todoPreferences.js'

export default function TodoDetailModal({ todo, isLoading, error, onClose, preference }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-header">
          <div>
            <p className="eyebrow">TODO DETAIL</p>
            <h2 id="detail-title">할 일 상세</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="상세 창 닫기">×</button>
        </div>

        {isLoading && <p className="modal-status" role="status">상세 정보를 불러오는 중…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {todo && (
          <dl className="detail-list">
            <div><dt>제목</dt><dd style={{ color: getColorValue(preference?.color) }}>{todo.title}</dd></div>
            <div><dt>분류</dt><dd>{getCategoryLabel(preference?.category)}</dd></div>
            <div><dt>상태</dt><dd>{todo.is_done ? '완료' : '진행 중'}</dd></div>
            <div><dt>마감</dt><dd>{formatDueAtKst(todo.due_at)}</dd></div>
            <div><dt>생성</dt><dd>{formatCreatedAtKst(todo.created_at)}</dd></div>
          </dl>
        )}
        <p className="timezone-note">모든 날짜와 시각은 한국시간(KST, UTC+9) 기준입니다.</p>
      </section>
    </div>
  )
}
