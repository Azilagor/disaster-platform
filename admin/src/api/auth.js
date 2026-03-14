import { fetchWithAuth, parseJsonResponse } from './client.js'

const AUTH = '/auth'

export async function login(email, password) {
  const res = await fetchWithAuth(`${AUTH}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return parseJsonResponse(res)
}

export async function getCurrentUser(token) {
  const opts = {}
  if (token) opts.headers = { Authorization: `Bearer ${token}` }
  const res = await fetchWithAuth(`${AUTH}/me`, { method: 'GET', ...opts })
  const data = await parseJsonResponse(res)
  return data.user ?? data
}
