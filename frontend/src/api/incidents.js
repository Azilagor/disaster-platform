import { fetchWithAuth, parseJsonResponse } from './client.js'

const INCIDENTS = '/incidents'

export async function getIncidents(params = {}) {
  const q = new URLSearchParams()
  ;['severity', 'status', 'district', 'page', 'limit'].forEach((key) => {
    if (params[key] != null && params[key] !== '') q.set(key, params[key])
  })
  const query = q.toString()
  const res = await fetchWithAuth(`${INCIDENTS}${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

export async function getIncident(id) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}`)
  return parseJsonResponse(res)
}

/** Активные инциденты (ACTIVE, RESOLVING). GET /incidents/active?district= — без auth. */
export async function getActiveIncidents(params = {}) {
  const q = new URLSearchParams()
  if (params.district != null && params.district !== '') q.set('district', params.district)
  const query = q.toString()
  const res = await fetchWithAuth(`${INCIDENTS}/active${query ? '?' + query : ''}`)
  return parseJsonResponse(res)
}

export async function createIncident(data) {
  const res = await fetchWithAuth(INCIDENTS, {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      severity: data.severity,
      district: data.district,
    }),
  })
  return parseJsonResponse(res)
}

export async function updateIncident(id, data) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return parseJsonResponse(res)
}

export async function patchIncidentStatus(id, status) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return parseJsonResponse(res)
}

/** Удалить инцидент (только админ). DELETE /incidents/:id */
export async function deleteIncident(id) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}
