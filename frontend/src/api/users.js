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

export const getDiscordAuthUrl = () => apiRequest('/auth/discord/login', { auth: true })

export const getGoogleAuthUrl = () => apiRequest('/auth/google/login', { auth: true })

export const disconnectDiscord = () => apiRequest('/auth/discord/disconnect', { method: 'DELETE', auth: true })

export const disconnectGoogle = () => apiRequest('/auth/google/disconnect', { method: 'DELETE', auth: true })
