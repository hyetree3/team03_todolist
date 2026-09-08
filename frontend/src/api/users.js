import { apiRequest } from './client.js'

export const getMe = () => apiRequest('/users/me', { auth: true })

export const updateMe = (changes) => apiRequest('/users/me', {
  method: 'PATCH',
  auth: true,
  body: changes,
})

export const getPoints = (period = 'today') => (
  apiRequest(`/users/me/points?period=${encodeURIComponent(period)}`, { auth: true })
)
