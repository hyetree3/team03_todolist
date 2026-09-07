import { apiRequest } from './client.js'

export const getTodos = () => apiRequest('/todos', { auth: true })
export const getTodo = (id) => apiRequest(`/todos/${id}`, { auth: true })

export const createTodo = (todo) => apiRequest('/todos', {
  method: 'POST',
  auth: true,
  body: todo,
})

export const updateTodo = (id, changes) => apiRequest(`/todos/${id}`, {
  method: 'PATCH',
  auth: true,
  body: changes,
})

export const deleteTodo = (id) => apiRequest(`/todos/${id}`, {
  method: 'DELETE',
  auth: true,
})
