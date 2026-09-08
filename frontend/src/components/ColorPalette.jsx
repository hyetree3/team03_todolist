import { TODO_COLORS } from '../utils/todoPreferences.js'

export default function ColorPalette({ value, onChange }) {
  return (
    <fieldset className="option-group color-selector">
      <legend>글자 색상</legend>
      <div className="color-options">
        {TODO_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className={value === color.id ? 'is-selected' : ''}
            aria-label={color.label}
            aria-pressed={value === color.id}
            onClick={() => onChange(color.id)}
            style={{ '--swatch-color': color.value }}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
