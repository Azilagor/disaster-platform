import { fetchWithAuth, parseJsonResponse } from './client.js'

const INCIDENTS = '/incidents'

export async function getIncidents(params = {}) {
  const q = new URLSearchParams()
  if (params.severity) q.set('severity', params.severity)
  if (params.status) q.set('status', params.status)
  if (params.district) q.set('district', params.district)
  if (params.page) q.set('page', params.page)
  if (params.limit) q.set('limit', params.limit)
  const query = q.toString()
  const res = await fetchWithAuth(`${INCIDENTS}/${query ? `?${query}` : ''}`)
  return parseJsonResponse(res)
}

export async function getIncident(id) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}`)
  return parseJsonResponse(res)
}

export async function createIncident(data) {
  const res = await fetchWithAuth(INCIDENTS, {
    method: 'POST',
    body: JSON.stringify(data),
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

export async function setIncidentStatus(id, status) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return parseJsonResponse(res)
}

export async function deleteIncident(id) {
  const res = await fetchWithAuth(`${INCIDENTS}/${id}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}
