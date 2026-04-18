/**
 * @param {string | { key: string, field?: string, params?: Record<string, unknown> } | null | undefined} err
 * @param {(key: string, values?: Record<string, unknown>) => string} t - vue-i18n t
 */
export function translateValidationError(err, t) {
  if (err == null || err === '') return ''
  if (typeof err === 'string') return t(err)
  if (typeof err === 'object' && err !== null && 'key' in err) {
    const values = { ...(err.params || {}) }
    if (err.field) values.field = t(err.field)
    return t(err.key, values)
  }
  return String(err)
}
