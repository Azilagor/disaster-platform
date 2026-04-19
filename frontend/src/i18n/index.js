import { createI18n } from 'vue-i18n'
import ru from '../locales/ru.json'
import en from '../locales/en.json'
import kk from '../locales/kk.json'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getStoredLocale,
  parseLocaleFromNavigator,
  setDocumentLang,
} from './locale.js'

const initialLocale = getStoredLocale() || parseLocaleFromNavigator() || 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'ru',
  messages: { ru, en, kk },
  globalInjection: true,
})

setDocumentLang(initialLocale)

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  setDocumentLang(locale)
}
