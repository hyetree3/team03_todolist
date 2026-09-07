import TodoItem from './TodoItem.jsx'

export default function TodoSection({ eyebrow, title, todos, emptyMessage, ...itemActions }) {
  return (
    <section className="todo-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="todo-count" aria-label={`${todos.length}개`}>{todos.length}</span>
      </div>
      {todos.length > 0 ? (
        <ul className="todo-list">
          {todos.map((todo) => <TodoItem key={todo.id} todo={todo} {...itemActions} />)}
        </ul>
      ) : (
        <div className="section-empty">
          <span className="section-empty-mark" aria-hidden="true" />
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  )
}
