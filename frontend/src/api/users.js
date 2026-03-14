import { fetchWithAuth, parseJsonResponse } from './client.js'

const USERS = '/users'

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
