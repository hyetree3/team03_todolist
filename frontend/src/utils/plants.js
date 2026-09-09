const SEEDLING_POT = { id: 'pot', label: '새싹 화분' }

export const PLANT_TYPES = [
  SEEDLING_POT,
  { id: 'mushroom', label: '숲버섯' },
  // 기존 localStorage 기록과의 호환을 위해 id는 tree를 유지합니다.
  { id: 'tree', label: '해바라기' },
]

export const DEFAULT_PLANT_TYPE = SEEDLING_POT.id

export const isPlantType = (value) => PLANT_TYPES.some(({ id }) => id === value)

export const getPlantLabel = (value) => PLANT_TYPES.find(({ id }) => id === value)?.label || '식물'
