import { fetchWithAuth, parseJsonResponse } from './client.js'

/**
 * Получить данные дашборда для текущего пользователя.
 * GET /dashboard
 *
 * Ответ зависит от роли:
 *
 * COORDINATOR/ADMIN → { role, requests: { total, new, inProgress, done, cancelled,
 *   published, byPriority, byDistrict }, volunteers: { total },
 *   incidents: { active }, recentRequests }
 *
 * VOLUNTEER → { role, myTasks: { total, inProgress, done },
 *   availableRequests, incidents: { active } }
 *
 * USER → { role, myRequests: { total, inProgress, done, recent },
 *   incidents: { active } }
 */
export async function getDashboard() {
  const res = await fetchWithAuth('/dashboard')
  return parseJsonResponse(res)
}