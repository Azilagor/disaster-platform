import { API_BASE_URL } from './config.js'

/**
 * Получить токен из localStorage (единая точка доступа).
 */
export function getStoredToken() {
  return localStorage.getItem('token')
}

/**
 * Запрос с автоматическим добавлением Bearer токена.
 * В конец URL добавляется слеш (требование бэкенда).
 * @param {string} url - полный URL или путь относительно API_BASE_URL
 * @param {RequestInit} options - опции fetch
 * @param {boolean} useFullUrl - если true, url считается полным
 */
/**
 * Очистить сессию (токен и пользователь) и редирект на /login.
 * Используется при 401 без зависимости от store/router.
 */
function clearSessionAndRedirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export async function fetchWithAuth(url, options = {}, useFullUrl = false) {
  const token = getStoredToken()
  const path = useFullUrl ? url : `${API_BASE_URL}${url}`
  const fullUrl = path.endsWith('/') ? path : `${path}/`
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

/**
 * POST с FormData (multipart). Не устанавливает Content-Type — браузер выставит boundary.
 * @param {string} url - путь относительно API_BASE_URL
 * @param {FormData} formData
 * @returns {Promise<Response>}
 */
export async function fetchWithAuthFormData(url, formData) {
  const token = getStoredToken()
  const path = `${API_BASE_URL}${url}`
  const fullUrl = path.endsWith('/') ? path : `${path}/`
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const response = await fetch(fullUrl, { method: 'POST', headers, body: formData })
  if (response.status === 401) {
    clearSessionAndRedirectToLogin()
    const error = new Error('Необходима повторная авторизация')
    error.status = 401
    throw error
  }
  return response
}

/**
 * Повтор запроса при ошибке сети/таймауте.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} retries
 */
export async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    return await fetchWithAuth(url, options)
  } catch (error) {
    if (retries > 0) {
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

/**
 * Парсинг JSON ответа с проверкой ok.
 * Бросает ошибку с текстом от бэка при 4xx/5xx.
 */
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
