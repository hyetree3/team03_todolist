import CategorySelector from './CategorySelector.jsx'
import ColorPalette from './ColorPalette.jsx'

export default function TodoOptions({ category, color, onCategoryChange, onColorChange }) {
  return (
    <div className="todo-options">
      <CategorySelector value={category} onChange={onCategoryChange} />
      <ColorPalette value={color} onChange={onColorChange} />
    </div>
  )
}
