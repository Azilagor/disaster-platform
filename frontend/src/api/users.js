import { fetchWithAuth, parseJsonResponse } from './client.js'

const USERS = '/users'

/**
 * Список пользователей (админ). GET /users?role=&district=&search=&page=&limit=
 */
export async function getUsers(params = {}) {
  const q = new URLSearchParams()
  ;['role', 'district', 'search', 'isEmailVerified', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${USERS}${query ? '?' + query : ''}`)
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

/**
 * Статистика пользователей (координатор/админ). GET /users/stats → { total, unverified, byRole }
 */
export async function getUsersStats() {
  const res = await fetchWithAuth(`${USERS}/stats`)
  return parseJsonResponse(res)
}

/**
 * Список волонтёров (координатор/админ). GET /users/volunteers?district=&search=&page=&limit=
 */
export async function getVolunteers(params = {}) {
  const q = new URLSearchParams()
  ;['district', 'search', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${USERS}/volunteers${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}
