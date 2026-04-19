import {
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_PRIORITIES,
  ALLOWED_DISTRICTS,
} from '../constants/requests.js'

/**
 * Нормализация: убирает лишние пробелы по краям
 */
export function trimValue(value) {
  if (value == null || typeof value !== 'string') return ''
  return value.trim()
}

/**
 * Нормализация email: trim + обрезка всего после домена (например после gmail.com)
 * Оставляет только валидную часть local@domain.tld
 */
export function normalizeEmail(email) {
  const s = trimValue(email)
  if (!s) return ''
  // Берём первое совпадение с форматом email (обрезаем мусор после)
  const match = s.match(/^[^\s@]+@[^\s@]+\.[^\s@]+/)
  return match ? match[0] : s
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Валидация email
 * @returns {string|null} null если ОК, иначе ключ i18n (validation.*)
 */
export function validateEmail(email) {
  const v = trimValue(email)
  if (!v) return 'validation.emailRequired'
  if (!EMAIL_RE.test(v)) return 'validation.emailInvalid'
  return null
}

/**
 * Валидация пароля: мин 8 символов, 1 заглавная, 1 цифра, 1 спецсимвол
 * @returns {string|null} null или ключ i18n
 */
export function validatePassword(password) {
  const v = password == null ? '' : String(password)
  if (!v.trim()) return 'validation.passwordRequired'
  if (v.length < 8) return 'validation.passwordMinLength'
  if (!/[A-Z]/.test(v)) return 'validation.passwordUppercase'
  if (!/[0-9]/.test(v)) return 'validation.passwordDigit'
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v)) return 'validation.passwordSpecial'
  return null
}

/**
 * Валидация телефона (базовая: цифры, плюс, скобки, пробелы, дефисы; мин. длина)
 * @returns {string|null} null или ключ i18n
 */
export function validatePhone(phone) {
  const v = trimValue(phone)
  if (!v) return 'validation.phoneRequired'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 10) return 'validation.phoneInvalid'
  return null
}

/**
 * Валидация имени/фамилии
 * @param {string} name - значение
 * @param {'firstName' | 'lastName' | 'field'} fieldKind
 * @returns {string|null} null или ключ i18n
 */
export function validateName(name, fieldKind = 'field') {
  const v = trimValue(name)
  if (!v) {
    if (fieldKind === 'firstName') return 'validation.firstNameRequired'
    if (fieldKind === 'lastName') return 'validation.lastNameRequired'
    return 'validation.fieldRequired'
  }
  if (v.length < 2) {
    if (fieldKind === 'firstName') return 'validation.firstNameMin'
    if (fieldKind === 'lastName') return 'validation.lastNameMin'
    return 'validation.fieldMin'
  }
  return null
}

/**
 * Проверка совпадения паролей
 * @returns {string|null} null или ключ i18n
 */
export function validatePasswordMatch(password, confirmPassword) {
  const p = password == null ? '' : String(password)
  const c = confirmPassword == null ? '' : String(confirmPassword)
  if (p !== c) return 'validation.passwordsMismatch'
  return null
}

/**
 * Валидация всей формы регистрации
 * @param {Object} formData - { firstName, lastName, email, phone, password, passwordConfirm, role }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateRegistrationForm(formData) {
  const errors = {}
  const fn = validateName(formData.firstName, 'firstName')
  if (fn) errors.firstName = fn
  const ln = validateName(formData.lastName, 'lastName')
  if (ln) errors.lastName = ln
  const em = validateEmail(formData.email)
  if (em) errors.email = em
  const ph = validatePhone(formData.phone)
  if (ph) errors.phone = ph
  const pw = validatePassword(formData.password)
  if (pw) errors.password = pw
  const pm = validatePasswordMatch(formData.password, formData.passwordConfirm)
  if (pm) errors.passwordConfirm = pm
  if (!trimValue(formData.role)) errors.role = 'validation.roleRequired'
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Валидация типа проблемы (по API)
 * @param {string} value - одно из ALLOWED_PROBLEM_TYPES
 * @returns {string|null}
 */
export function validateProblemType(value) {
  const v = trimValue(value)
  if (!v) return 'validation.problemTypeRequired'
  if (!ALLOWED_PROBLEM_TYPES.includes(v)) return 'validation.problemTypeInvalid'
  return null
}

/**
 * Валидация приоритета (по API)
 * @param {string} value - одно из ALLOWED_PRIORITIES
 * @returns {string|null}
 */
export function validatePriority(value) {
  const v = trimValue(value)
  if (!v) return 'validation.priorityRequired'
  if (!ALLOWED_PRIORITIES.includes(v)) return 'validation.priorityInvalid'
  return null
}

/**
 * Валидация района (по API)
 * @param {string} value - одно из ALLOWED_DISTRICTS
 * @returns {string|null}
 */
export function validateDistrict(value) {
  const v = trimValue(value)
  if (!v) return 'validation.districtRequired'
  if (!ALLOWED_DISTRICTS.includes(v)) return 'validation.districtInvalid'
  return null
}

/**
 * Валидация заголовка заявки (по API: 5–200 символов)
 * @param {string} value
 * @returns {string|null} null если ОК, иначе ключ i18n
 */
export function validateRequestTitle(value) {
  const v = trimValue(value)
  if (!v) return 'validation.titleRequired'
  if (v.length < 5) return 'validation.titleLength'
  if (v.length > 200) return 'validation.titleLength'
  return null
}

/**
 * Валидация описания заявки (по API: минимум 50 символов)
 * @param {string} value
 * @returns {string|null} null если ОК, иначе ключ i18n
 */
export function validateRequestDescription(value) {
  const v = trimValue(value)
  if (!v) return 'validation.descriptionRequired'
  if (v.length < 50) return 'validation.descriptionMin'
  return null
}

/**
 * Обязательный адрес (форма создания заявки)
 * @param {string} value
 * @returns {string|null}
 */
export function validateRequiredAddress(value) {
  const v = trimValue(value)
  if (!v) return 'validation.addressRequired'
  return null
}
