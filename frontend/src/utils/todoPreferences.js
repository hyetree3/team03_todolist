export const TODO_CATEGORIES = [
  { id: 'general', label: '일반' },
  { id: 'study', label: '공부' },
  { id: 'career', label: '취업' },
  { id: 'project', label: '프로젝트' },
  { id: 'personal', label: '개인' },
  { id: 'exercise', label: '운동' },
]

export const TODO_COLORS = [
  { id: 'dark', label: '기본', value: '#20231f' },
  { id: 'navy', label: '네이비', value: '#46566d' },
  { id: 'blue', label: '블루', value: '#4f6f8d' },
  { id: 'teal', label: '틸', value: '#3f736f' },
  { id: 'green', label: '그린', value: '#456b57' },
  { id: 'olive', label: '올리브', value: '#70714b' },
  { id: 'purple', label: '퍼플', value: '#685d7c' },
  { id: 'violet', label: '바이올렛', value: '#78617d' },
  { id: 'coral', label: '코랄', value: '#9a6259' },
  { id: 'red', label: '레드', value: '#875356' },
  { id: 'orange', label: '오렌지', value: '#9a6a3e' },
  { id: 'brown', label: '브라운', value: '#715b4c' },
]

export const DEFAULT_TODO_PREFERENCE = { category: 'general', color: 'dark' }

const getStorageKey = (username) => `todo_preferences_${username}`

export function loadTodoPreferences(username) {
  if (!username) return {}
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey(username)) || '{}')
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  } catch {
    return {}
  }
}

export function saveTodoPreferences(username, preferences) {
  if (!username) return
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(preferences))
  } catch {
    // 저장 공간이 차단된 환경에서도 서버 Todo 기능은 계속 동작해야 한다.
  }
}

export function getTodoPreference(preferences, todoId) {
  return { ...DEFAULT_TODO_PREFERENCE, ...preferences[String(todoId)] }
}

export function getCategoryLabel(categoryId) {
  return TODO_CATEGORIES.find(({ id }) => id === categoryId)?.label || '일반'
}

export function getColorValue(colorId) {
  return TODO_COLORS.find(({ id }) => id === colorId)?.value || TODO_COLORS[0].value
}
