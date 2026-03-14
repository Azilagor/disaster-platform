/**
 * Базовый URL бэкенда: https://platform.oyustudio.kz/api/
 * Документация: https://platform.oyustudio.kz/api-docs/
 * В dev без VITE_API_URL используется /api (прокси) — нет CORS.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '/api' : 'https://platform.oyustudio.kz/api')

/** Базовый URL бэкенда без суффикса /api (для статики вроде /uploads/avatars/...) */
export function getUploadsBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, '')
}

/** Полный URL для пути к загрузке (например /uploads/avatars/xxx.jpg) */
export function getUploadsFullUrl(path) {
  if (!path || typeof path !== 'string') return ''
  if (path.startsWith('http')) return path
  return getUploadsBaseUrl() + (path.startsWith('/') ? path : '/' + path)
}

export const AUTH_PREFIX = '/auth'
