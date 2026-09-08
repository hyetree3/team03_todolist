import { useCallback, useEffect, useState } from 'react'
import { getMe, updateMe } from '../api/users.js'

export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setProfile(await getMe())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const updateProfile = async (changes) => {
    const updated = await updateMe(changes)
    setProfile(updated)
    return updated
  }

  return { profile, isLoading, error, loadProfile, updateProfile }
}
