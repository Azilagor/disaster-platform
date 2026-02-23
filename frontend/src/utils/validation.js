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
 * @returns {string|null} null если ОК, иначе текст ошибки
 */
export function validateEmail(email) {
  const v = trimValue(email)
  if (!v) return 'Email обязателен'
  if (!EMAIL_RE.test(v)) return 'Введите корректный email'
  return null
}

/**
 * Валидация пароля: мин 8 символов, 1 заглавная, 1 цифра, 1 спецсимвол
 * @returns {string|null} null или текст ошибки
 */
export function validatePassword(password) {
  const v = password == null ? '' : String(password)
  if (!v.trim()) return 'Пароль обязателен'
  if (v.length < 8) return 'Пароль должен быть не менее 8 символов'
  if (!/[A-Z]/.test(v)) return 'Нужна хотя бы одна заглавная буква'
  if (!/[0-9]/.test(v)) return 'Нужна хотя бы одна цифра'
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v)) return 'Нужен хотя бы один спецсимвол'
  return null
}

/**
 * Валидация телефона (базовая: цифры, плюс, скобки, пробелы, дефисы; мин. длина)
 * @returns {string|null} null или текст ошибки
 */
export function validatePhone(phone) {
  const v = trimValue(phone)
  if (!v) return 'Телефон обязателен'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 10) return 'Введите корректный номер телефона'
  return null
}

/**
 * Валидация имени/фамилии
 * @param {string} name - значение
 * @param {string} fieldName - например "Имя" или "Фамилия"
 * @returns {string|null} null или текст ошибки
 */
export function validateName(name, fieldName = 'Поле') {
  const v = trimValue(name)
  if (!v) return `${fieldName} обязательно`
  if (v.length < 2) return `${fieldName} должно быть не менее 2 символов`
  return null
}

/**
 * Проверка совпадения паролей
 * @returns {string|null} null или "Пароли не совпадают"
 */
export function validatePasswordMatch(password, confirmPassword) {
  const p = password == null ? '' : String(password)
  const c = confirmPassword == null ? '' : String(confirmPassword)
  if (p !== c) return 'Пароли не совпадают'
  return null
}

/**
 * Валидация всей формы регистрации
 * @param {Object} formData - { firstName, lastName, email, phone, password, passwordConfirm, role }
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateRegistrationForm(formData) {
  const errors = {}
  const fn = validateName(formData.firstName, 'Имя')
  if (fn) errors.firstName = fn
  const ln = validateName(formData.lastName, 'Фамилия')
  if (ln) errors.lastName = ln
  const em = validateEmail(formData.email)
  if (em) errors.email = em
  const ph = validatePhone(formData.phone)
  if (ph) errors.phone = ph
  const pw = validatePassword(formData.password)
  if (pw) errors.password = pw
  const pm = validatePasswordMatch(formData.password, formData.passwordConfirm)
  if (pm) errors.passwordConfirm = pm
  if (!trimValue(formData.role)) errors.role = 'Выберите роль'
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
  if (!v) return 'Выберите тип проблемы'
  if (!ALLOWED_PROBLEM_TYPES.includes(v)) return 'Недопустимый тип проблемы'
  return null
}

/**
 * Валидация приоритета (по API)
 * @param {string} value - одно из ALLOWED_PRIORITIES
 * @returns {string|null}
 */
export function validatePriority(value) {
  const v = trimValue(value)
  if (!v) return 'Выберите приоритет'
  if (!ALLOWED_PRIORITIES.includes(v)) return 'Недопустимый приоритет'
  return null
}

/**
 * Валидация района (по API)
 * @param {string} value - одно из ALLOWED_DISTRICTS
 * @returns {string|null}
 */
export function validateDistrict(value) {
  const v = trimValue(value)
  if (!v) return 'Выберите район'
  if (!ALLOWED_DISTRICTS.includes(v)) return 'Недопустимый район'
  return null
}
