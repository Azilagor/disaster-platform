/**
 * Базовый URL бэкенда: https://platform.oyustudio.kz/api/
 * Документация: https://platform.oyustudio.kz/api-docs/
 * Для локального бэка задайте VITE_API_URL=/api в .env.local.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4999/api'

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
