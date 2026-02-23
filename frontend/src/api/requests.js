import { fetchWithAuth, parseJsonResponse } from './client.js'

const REQUESTS = '/requests'

/**
 * Мои заявки (созданные текущим пользователем).
 * Бэк: GET /requests/my → 200 [ Request, ... ]
 * @returns {Promise<Array<{ id, title, description, priority, status, address, district, problemType, createdAt, ... }>>}
 */
export async function getMyRequests() {
  const res = await fetchWithAuth(`${REQUESTS}/my`)
  return parseJsonResponse(res)
}

/**
 * Создать запрос о помощи.
 * Бэк: POST /requests/ → 201 { message, request? }
 * Обязательные: problemType, title, description, priority, address, district.
 * @param {Object} data - { problemType, title, description, priority, address, district, peopleCount?, contactName?, contactPhone?, contactComment? }
 * @param {string} data.problemType - тип (MEDICAL, FOOD, ...)
 * @param {string} data.priority - приоритет (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {string} data.district - район (ALMALYNSKIY, AUEZOVSKIY, ...)
 * @returns {Promise<{ message, request }>}
 */
export async function createRequest(data) {
  const res = await fetchWithAuth(REQUESTS, {
    method: 'POST',
    body: JSON.stringify({
      problemType: data.problemType,
      title: data.title,
      description: data.description,
      priority: data.priority,
      address: data.address,
      district: data.district,
      peopleCount: data.peopleCount ?? 1,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      ...(data.contactComment && { contactComment: data.contactComment }),
    }),
  })
  return parseJsonResponse(res)
}
