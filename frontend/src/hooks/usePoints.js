import { useCallback, useEffect, useState } from 'react'
import { getPoints } from '../api/users.js'

export function usePoints(period = 'today') {
  const [points, setPoints] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPoints = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setPoints(await getPoints(period))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadPoints()
  }, [loadPoints])

  return { points, isLoading, error, loadPoints }
}
