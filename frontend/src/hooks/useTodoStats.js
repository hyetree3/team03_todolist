import { useCallback, useEffect, useState } from 'react'
import { getTodoStats } from '../api/todos.js'

export function useTodoStats(period = 'week') {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setStats(await getTodoStats(period))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, isLoading, error, loadStats }
}
