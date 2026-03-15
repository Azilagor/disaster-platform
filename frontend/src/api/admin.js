import { fetchWithAuth, parseJsonResponse } from './client.js'

/** GET /admin/overview — сводная статистика для админа */
export async function getOverview() {
  const res = await fetchWithAuth('/admin/overview')
  return parseJsonResponse(res)
}

/**
 * GET /admin/logs — лог активности.
 * @param {Object} params - { action?, entityType?, userId?, page?, limit? }
 */
export async function getLogs(params = {}) {
  const q = new URLSearchParams()
  ;['action', 'entityType', 'userId', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`/admin/logs${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

/**
 * GET /admin/users — список всех пользователей (алиас для админа).
 */
export async function getAdminUsers(params = {}) {
  const q = new URLSearchParams()
  ;['role', 'district', 'search', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`/admin/users${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

/**
 * PATCH /admin/users/:id/role — сменить роль пользователя.
 */
export async function setUserRoleAdmin(id, role) {
  const res = await fetchWithAuth(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
  return parseJsonResponse(res)
}