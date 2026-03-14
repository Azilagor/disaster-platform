import { fetchWithAuth, parseJsonResponse } from './client.js'

const USERS = '/users'

export async function getUsers(params = {}) {
  const q = new URLSearchParams()
  if (params.role) q.set('role', params.role)
  if (params.district) q.set('district', params.district)
  if (params.search) q.set('search', params.search)
  if (params.isEmailVerified !== undefined) q.set('isEmailVerified', params.isEmailVerified)
  if (params.page) q.set('page', params.page)
  if (params.limit) q.set('limit', params.limit)
  const query = q.toString()
  const res = await fetchWithAuth(`${USERS}/${query ? `?${query}` : ''}`)
  return parseJsonResponse(res)
}

export async function getUser(id) {
  const res = await fetchWithAuth(`${USERS}/${id}`)
  return parseJsonResponse(res)
}

export async function updateUser(id, data) {
  const res = await fetchWithAuth(`${USERS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return parseJsonResponse(res)
}

export async function setUserRole(id, role) {
  const res = await fetchWithAuth(`${USERS}/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
  return parseJsonResponse(res)
}

export async function deleteUser(id) {
  const res = await fetchWithAuth(`${USERS}/${id}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}
