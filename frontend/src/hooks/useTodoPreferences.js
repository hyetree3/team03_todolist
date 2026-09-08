import { useEffect, useState } from 'react'
import { loadTodoPreferences, saveTodoPreferences } from '../utils/todoPreferences.js'

export function useTodoPreferences(username) {
  const [preferences, setPreferences] = useState(() => loadTodoPreferences(username))

  useEffect(() => {
    setPreferences(loadTodoPreferences(username))
  }, [username])

  const updatePreference = (todoId, nextPreference) => {
    setPreferences((current) => {
      const next = {
        ...current,
        [String(todoId)]: {
          ...current[String(todoId)],
          ...nextPreference,
        },
      }
      saveTodoPreferences(username, next)
      return next
    })
  }

  const removePreference = (todoId) => {
    setPreferences((current) => {
      const next = { ...current }
      delete next[String(todoId)]
      saveTodoPreferences(username, next)
      return next
    })
  }

  return { preferences, updatePreference, removePreference }
}
