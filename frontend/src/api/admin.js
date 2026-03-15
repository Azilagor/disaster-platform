import { fetchWithAuth, parseJsonResponse } from './client.js'

/** GET /users/admin/overview — дашборд админки */
export async function getOverview() {
  const res = await fetchWithAuth('/users/admin/overview')
  return parseJsonResponse(res)
}
