export const LOCALE_STORAGE_KEY = 'disasterhelp_locale'

export const SUPPORTED_LOCALES = ['ru', 'en', 'kk']

export function parseLocaleFromNavigator() {
  if (typeof navigator === 'undefined') return 'ru'
  const base = navigator.language.split('-')[0].toLowerCase()
  if (SUPPORTED_LOCALES.includes(base)) return base
  return 'ru'
}

export function getStoredLocale() {
  try {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (s && SUPPORTED_LOCALES.includes(s)) return s
  } catch {
    /* ignore */
  }
  return null
}

export function setDocumentLang(locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}
