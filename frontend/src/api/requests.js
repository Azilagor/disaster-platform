import { fetchWithAuth, parseJsonResponse } from './client.js'

const REQUESTS = '/requests'

/**
 * Создать запрос о помощи.
 * Бэк: POST /requests/ → 201 { message, request? }
 * @param {Object} data - { problemType, address, description, priority, peopleCount, contactName, contactPhone, contactComment? }
 * @param {string} data.problemType - тип (MEDICAL, FOOD, ...)
 * @param {string} data.priority - приоритет (LOW, MEDIUM, HIGH, CRITICAL)
 * @returns {Promise<{ message, request }>}
 */
export async function createRequest(data) {
  const res = await fetchWithAuth(REQUESTS, {
    method: 'POST',
    body: JSON.stringify({
      problemType: data.problemType,
      address: data.address,
      description: data.description,
      priority: data.priority,
      peopleCount: data.peopleCount ?? 1,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      ...(data.contactComment && { contactComment: data.contactComment }),
    }),
  })
  return parseJsonResponse(res)
}
