import { useCallback, useEffect, useState } from 'react'
import {
  createTodo as requestCreateTodo,
  deleteTodo as requestDeleteTodo,
  getTodo as requestGetTodo,
  getTodos,
  updateTodo as requestUpdateTodo,
} from '../api/todos.js'

export function useTodos() {
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTodos = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await getTodos()
      setTodos(response)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const createTodo = async (payload) => {
    const created = await requestCreateTodo(payload)
    setTodos((current) => [created, ...current])
    return created
  }

  const updateTodo = async (id, changes) => {
    const updated = await requestUpdateTodo(id, changes)
    setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
    return updated
  }

  const deleteTodo = async (id) => {
    await requestDeleteTodo(id)
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const getTodo = (id) => requestGetTodo(id)

  return {
    todos,
    isLoading,
    error,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    getTodo,
  }
}
