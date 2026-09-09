import { apiRequest } from './client.js'

export function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function register(user) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: user,
  })
}
