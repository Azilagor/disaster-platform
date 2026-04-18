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
  const match = s.match(/^[^\s@]+@[^\s@]+\.[^\s@]+/)
  return match ? match[0] : s
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @returns {string | { key: string, field: string } | null}
 */
export function validateEmail(email) {
  const v = trimValue(email)
  if (!v) return 'validation.emailRequired'
  if (!EMAIL_RE.test(v)) return 'validation.emailInvalid'
  return null
}

/**
 * @returns {string | null}
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
 * @param {string} name
 * @param {string} fieldLabelKey - i18n key, e.g. profile.firstName
 * @returns {{ key: string, field: string } | null}
 */
export function validateName(name, fieldLabelKey = 'common.field') {
  const v = trimValue(name)
  if (!v) return { key: 'validation.fieldRequired', field: fieldLabelKey }
  if (v.length < 2) return { key: 'validation.fieldMinLength', field: fieldLabelKey }
  return null
}

/**
 * @returns {string | null}
 */
export function validatePasswordMatch(password, confirmPassword) {
  const p = password == null ? '' : String(password)
  const c = confirmPassword == null ? '' : String(confirmPassword)
  if (p !== c) return 'validation.passwordMismatch'
  return null
}

/**
 * @param {Object} formData - { firstName, lastName, email, phone, password, passwordConfirm, role }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateRegistrationForm(formData) {
  const errors = {}
  const fn = validateName(formData.firstName, 'profile.firstName')
  if (fn) errors.firstName = fn
  const ln = validateName(formData.lastName, 'profile.lastName')
  if (ln) errors.lastName = ln
  const em = validateEmail(formData.email)
  if (em) errors.email = em
  const ph = validatePhone(formData.phone)
  if (ph) errors.phone = ph
  const pw = validatePassword(formData.password)
  if (pw) errors.password = pw
  const pm = validatePasswordMatch(formData.password, formData.passwordConfirm)
  if (pm) errors.passwordConfirm = pm
  if (!trimValue(formData.role)) errors.role = 'validation.selectRole'
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * @returns {string | null}
 */
export function validateProblemType(value) {
  const v = trimValue(value)
  if (!v) return 'validation.problemTypeRequired'
  if (!ALLOWED_PROBLEM_TYPES.includes(v)) return 'validation.problemTypeInvalid'
  return null
}

/**
 * @returns {string | null}
 */
export function validatePriority(value) {
  const v = trimValue(value)
  if (!v) return 'validation.priorityRequired'
  if (!ALLOWED_PRIORITIES.includes(v)) return 'validation.priorityInvalid'
  return null
}

/**
 * @returns {string | null}
 */
export function validateDistrict(value) {
  const v = trimValue(value)
  if (!v) return 'validation.districtRequired'
  if (!ALLOWED_DISTRICTS.includes(v)) return 'validation.districtInvalid'
  return null
}

/**
 * @returns {string | null}
 */
export function validateRequestTitle(value) {
  const v = trimValue(value)
  if (!v) return 'validation.requestTitleRequired'
  if (v.length < 5) return 'validation.requestTitleLength'
  if (v.length > 200) return 'validation.requestTitleLength'
  return null
}

/**
 * @returns {string | null}
 */
export function validateRequestDescription(value) {
  const v = trimValue(value)
  if (!v) return 'validation.requestDescriptionRequired'
  if (v.length < 50) return 'validation.requestDescriptionMin'
  return null
}

/**
 * @returns {string | null}
 */
export function validatePhone(phone) {
  const v = trimValue(phone)
  if (!v) return 'validation.phoneRequired'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 10) return 'validation.phoneInvalid'
  return null
}
