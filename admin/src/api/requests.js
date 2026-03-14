import { fetchWithAuth, parseJsonResponse } from './client.js'

const REQUESTS = '/requests'

export async function getRequests(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.priority) q.set('priority', params.priority)
  if (params.problemType) q.set('problemType', params.problemType)
  if (params.district) q.set('district', params.district)
  if (params.search) q.set('search', params.search)
  if (params.page) q.set('page', params.page)
  if (params.limit) q.set('limit', params.limit)
  const query = q.toString()
  const res = await fetchWithAuth(`${REQUESTS}/${query ? `?${query}` : ''}`)
  return parseJsonResponse(res)
}

export async function getRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}`)
  return parseJsonResponse(res)
}

export async function setRequestStatus(id, status) {
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

export async function deleteRequest(id) {
  const res = await fetchWithAuth(`${REQUESTS}/${id}`, { method: 'DELETE' })
  return parseJsonResponse(res)
}
