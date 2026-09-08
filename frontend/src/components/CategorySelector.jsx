import { TODO_CATEGORIES } from '../utils/todoPreferences.js'

export default function CategorySelector({ value, onChange, legend = '목표 / 분류' }) {
  return (
    <fieldset className="option-group category-selector">
      <legend>{legend}</legend>
      <div className="category-options">
        {TODO_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={value === category.id ? 'is-selected' : ''}
            aria-pressed={value === category.id}
            onClick={() => onChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
