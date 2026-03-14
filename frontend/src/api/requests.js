import { fetchWithAuth, parseJsonResponse } from './client.js'

const REQUESTS = '/requests'

/**
 * Мои заявки (созданные текущим пользователем).
 * Бэк: GET /requests/my → 200 { items, total, page, limit }
 * @returns {Promise<Array<...>>}
 */
export async function getMyRequests(params = {}) {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', params.page)
  if (params.limit != null) q.set('limit', params.limit)
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}/my${query ? '?' + query : ''}`)
  const data = await parseJsonResponse(res)
  return data.items ?? []
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

export async function getRequests(params = {}) {
  const q = new URLSearchParams()
  ;['status', 'priority', 'problemType', 'district', 'search', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

export async function getRequestsMap(params = {}) {
  const q = new URLSearchParams()
  ;['priority', 'problemType', 'district'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}/map${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

/** Доступные заявки для волонтёра (опубликованные, на которые можно откликнуться). Использует GET /requests/map (те же данные, доступно VOLUNTEER). */
export async function getAvailableRequests(params = {}) {
  const q = new URLSearchParams()
  ;['priority', 'problemType', 'district'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}/map${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

export async function getRequestsAssigned(params = {}) {
  const q = new URLSearchParams()
  ;['status', 'priority', 'problemType', 'district', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}/assigned${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

export async function getRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}`)
  return parseJsonResponse(res)
}

/**
 * Обновить заявку. Бэк: PUT /requests/:id. Координатор или владелец.
 * @param {number} id
 * @param {Object} data - { title?, description?, priority?, problemType?, peopleCount?, address?, district?, landmark?, additionalInfo?, contactName?, contactPhone?, contactEmail?, contactTelegram?, latitude?, longitude? }
 * @returns {Promise<{ message, request }>}
 */
export async function updateRequest(id, data) {
  const body = {}
  const keys = [
    'title', 'description', 'priority', 'problemType', 'peopleCount',
    'address', 'district', 'landmark', 'additionalInfo',
    'contactName', 'contactPhone', 'contactEmail', 'contactTelegram',
    'latitude', 'longitude',
  ]
  keys.forEach((key) => {
    if (data[key] !== undefined) body[key] = data[key]
  })
  const res = await fetchWithAuth(`${REQUESTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return parseJsonResponse(res)
}

export async function patchRequestStatus(id, status) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return parseJsonResponse(res)
}

export async function publishRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}/publish`, { method: 'PATCH' })
  return parseJsonResponse(res)
}

export async function unpublishRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}/unpublish`, { method: 'PATCH' })
  return parseJsonResponse(res)
}

export async function assignVolunteer(requestId, volunteerId) {
  const res = await fetchWithAuth(`${REQUESTS}/${requestId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ volunteerId }),
  })
  return parseJsonResponse(res)
}

export async function unassignVolunteer(requestId, volunteerId) {
  const res = await fetchWithAuth(`${REQUESTS}/${requestId}/assign/${volunteerId}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}

export async function volunteerRespond(requestId) {
  const res = await fetchWithAuth(`${REQUESTS}/${requestId}/volunteer`, { method: 'POST' })
  return parseJsonResponse(res)
}

export async function volunteerLeave(requestId) {
  const res = await fetchWithAuth(`${REQUESTS}/${requestId}/volunteer`, { method: 'DELETE' })
  return parseJsonResponse(res)
}

/** Удалить заявку (только админ). DELETE /requests/:id */
export async function deleteRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}
