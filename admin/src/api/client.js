import { API_BASE_URL } from './config.js'

export function getStoredToken() {
  return localStorage.getItem('token')
}

function clearSessionAndRedirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export async function fetchWithAuth(url, options = {}, useFullUrl = false) {
  const token = getStoredToken()
  const path = useFullUrl ? url : `${API_BASE_URL}${url}`
  const fullUrl = path.includes('?') ? path : (path.endsWith('/') ? path : `${path}/`)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const response = await fetch(fullUrl, { ...options, headers })
  if (response.status === 401) {
    clearSessionAndRedirectToLogin()
    const error = new Error('Необходима повторная авторизация')
    error.status = 401
    throw error
  }
  return response
}

export async function parseJsonResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = data.message || data.error || response.statusText
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}
