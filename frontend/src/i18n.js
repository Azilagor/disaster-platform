import { createI18n } from 'vue-i18n'
import ru from './locales/ru.json'
import en from './locales/en.json'
import kk from './locales/kk.json'

export const SUPPORTED_LOCALES = ['ru', 'en', 'kk']
const STORAGE_KEY = 'locale'

export function detectBrowserLocale() {
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  const lower = nav.toLowerCase()
  if (lower.startsWith('kk')) return 'kk'
  if (lower.startsWith('en')) return 'en'
  return 'ru'
}

export function getStoredLocale() {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s && SUPPORTED_LOCALES.includes(s)) return s
  } catch {
    /* ignore */
  }
  return null
}

export function getInitialLocale() {
  return getStoredLocale() || detectBrowserLocale()
}

export function persistLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

const initialLocale = getInitialLocale()
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'ru',
  messages: { ru, en, kk },
  globalInjection: true,
})
