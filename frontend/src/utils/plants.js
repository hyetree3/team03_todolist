export const PLANT_TYPES = [
  { id: 'pot', label: '새싹 화분' },
  { id: 'mushroom', label: '숲 버섯' },
  { id: 'tree', label: '작은 나무' },
]

export const isPlantType = (value) => PLANT_TYPES.some(({ id }) => id === value)

export const getPlantLabel = (value) => PLANT_TYPES.find(({ id }) => id === value)?.label || '식물'
