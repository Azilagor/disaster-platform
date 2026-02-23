/**
 * Базовый URL бэкенда: https://platform.oyustudio.kz/api/
 * Документация: https://platform.oyustudio.kz/api-docs/
 * В dev без VITE_API_URL используется /api (прокси) — нет CORS.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '/api' : 'https://platform.oyustudio.kz/api')

export const AUTH_PREFIX = '/auth'
