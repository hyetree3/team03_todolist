import { TODO_CATEGORIES } from '../utils/todoPreferences.js'

export default function CategoryFilter({ value, onChange }) {
  return (
    <nav className="category-filter" aria-label="Todo 분류 필터">
      <p>목표 / 분류</p>
      <div className="category-filter-items">
        <button type="button" className={value === 'all' ? 'is-selected' : ''} onClick={() => onChange('all')}>
          <span className="category-dot dot-all" aria-hidden="true" />전체
        </button>
        {TODO_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={value === category.id ? 'is-selected' : ''}
            onClick={() => onChange(category.id)}
          >
            <span className={`category-dot dot-${category.id}`} aria-hidden="true" />{category.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
