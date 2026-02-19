/**
 * Базовый URL бэкенда.
 * В dev: VITE_API_URL из .env или http://localhost:3000
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const AUTH_PREFIX = '/auth'
