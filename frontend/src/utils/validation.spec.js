/**
 * Unit tests for validation helpers.
 * All password-like values are test-only placeholders and must not be used as real credentials.
 */
import { describe, it, expect } from 'vitest'
import {
  trimValue,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validatePasswordMatch,
  validateRegistrationForm,
  validateProblemType,
  validatePriority,
  validateDistrict,
} from './validation.js'

describe('trimValue', () => {
  it('returns empty string for null/undefined', () => {
    expect(trimValue(null)).toBe('')
    expect(trimValue(undefined)).toBe('')
  })
  it('returns empty string for non-string', () => {
    expect(trimValue(123)).toBe('')
    expect(trimValue({})).toBe('')
  })
  it('trims whitespace', () => {
    expect(trimValue('  a  ')).toBe('a')
    expect(trimValue('\n\t x \t')).toBe('x')
  })
  it('returns same string when no spaces', () => {
    expect(trimValue('hello')).toBe('hello')
  })
})

describe('normalizeEmail', () => {
  it('returns empty string for empty/whitespace', () => {
    expect(normalizeEmail('')).toBe('')
    expect(normalizeEmail('   ')).toBe('')
  })
  it('trims and extracts valid email part', () => {
    expect(normalizeEmail('  user@mail.com  ')).toBe('user@mail.com')
    expect(normalizeEmail('user@mail.com extra')).toBe('user@mail.com')
    // Регулярка обрезает только по пробелу; после домена без пробела возвращает как есть
    expect(normalizeEmail('user@mail.com/path')).toBe('user@mail.com/path')
  })
  it('returns trimmed input if no valid email pattern', () => {
    expect(normalizeEmail('notanemail')).toBe('notanemail')
  })
})

describe('validateEmail', () => {
  it('returns error when empty', () => {
    expect(validateEmail('')).toBe('Email обязателен')
    expect(validateEmail('   ')).toBe('Email обязателен')
  })
  it('returns null for valid email', () => {
    expect(validateEmail('a@b.co')).toBe(null)
    expect(validateEmail('user@example.com')).toBe(null)
  })
  it('returns error for invalid format', () => {
    expect(validateEmail('no-at')).toBe('Введите корректный email')
    expect(validateEmail('@nodomain')).toBe('Введите корректный email')
    expect(validateEmail('nodot@domain')).toBe('Введите корректный email')
  })
})

describe('validatePassword', () => {
  it('returns error when empty', () => {
    expect(validatePassword('')).toBe('Пароль обязателен')
    expect(validatePassword('   ')).toBe('Пароль обязателен')
    expect(validatePassword(null)).toBe('Пароль обязателен')
  })
  it('returns error when less than 8 chars', () => {
    expect(validatePassword('Ab1!')).toBe('Пароль должен быть не менее 8 символов')
  })
  it('returns error when no uppercase', () => {
    expect(validatePassword('abcdefg1!')).toBe('Нужна хотя бы одна заглавная буква')
  })
  it('returns error when no digit', () => {
    expect(validatePassword('Abcdefgh!')).toBe('Нужна хотя бы одна цифра')
  })
  it('returns error when no special char', () => {
    expect(validatePassword('Abcdefgh1')).toBe('Нужен хотя бы один спецсимвол')
  })
  it('returns null for valid password', () => {
    expect(validatePassword('TestPwd1!')).toBe(null)
    expect(validatePassword('DemoPw2!')).toBe(null)
  })
})

describe('validatePhone', () => {
  it('returns error when empty', () => {
    expect(validatePhone('')).toBe('Телефон обязателен')
    expect(validatePhone('   ')).toBe('Телефон обязателен')
  })
  it('returns error when fewer than 10 digits', () => {
    expect(validatePhone('123')).toBe('Введите корректный номер телефона')
    expect(validatePhone('+7 (999) 12')).toBe('Введите корректный номер телефона')
  })
  it('returns null for 10+ digits', () => {
    expect(validatePhone('+7 999 123 45 67')).toBe(null)
    expect(validatePhone('89991234567')).toBe(null)
    expect(validatePhone('+7 (999) 123-45-67')).toBe(null)
  })
})

describe('validateName', () => {
  it('returns error when empty', () => {
    expect(validateName('')).toBe('Поле обязательно')
    expect(validateName('  ')).toBe('Поле обязательно')
    expect(validateName('', 'Имя')).toBe('Имя обязательно')
  })
  it('returns error when less than 2 chars', () => {
    expect(validateName('A')).toBe('Поле должно быть не менее 2 символов')
    expect(validateName('И', 'Имя')).toBe('Имя должно быть не менее 2 символов')
  })
  it('returns null for valid name', () => {
    expect(validateName('Иван')).toBe(null)
    expect(validateName('  Иван  ', 'Имя')).toBe(null)
  })
})

describe('validatePasswordMatch', () => {
  it('returns error when passwords differ', () => {
    expect(validatePasswordMatch('a', 'b')).toBe('Пароли не совпадают')
    expect(validatePasswordMatch('FirstPw1!', 'SecondPw2!')).toBe('Пароли не совпадают')
  })
  it('returns null when match', () => {
    expect(validatePasswordMatch('same', 'same')).toBe(null)
    expect(validatePasswordMatch(null, null)).toBe(null)
  })
})

describe('validateRegistrationForm', () => {
  it('returns valid: true when all fields valid', () => {
    const form = {
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@test.com',
      phone: '+7 999 123 45 67',
      password: 'TestPwd1!',
      passwordConfirm: 'TestPwd1!',
      role: 'user',
    }
    const result = validateRegistrationForm(form)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })
  it('returns errors for invalid fields', () => {
    const form = {
      firstName: '',
      lastName: 'X',
      email: 'bad',
      phone: '1',
      password: 'short',
      passwordConfirm: 'other',
      role: '',
    }
    const result = validateRegistrationForm(form)
    expect(result.valid).toBe(false)
    expect(result.errors.firstName).toBeDefined()
    expect(result.errors.lastName).toBeDefined()
    expect(result.errors.email).toBeDefined()
    expect(result.errors.phone).toBeDefined()
    expect(result.errors.password).toBeDefined()
    expect(result.errors.passwordConfirm).toBe('Пароли не совпадают')
    expect(result.errors.role).toBe('Выберите роль')
  })
})

describe('validateProblemType', () => {
  it('returns error when empty', () => {
    expect(validateProblemType('')).toBe('Выберите тип проблемы')
    expect(validateProblemType('  ')).toBe('Выберите тип проблемы')
  })
  it('returns error for invalid value', () => {
    expect(validateProblemType('INVALID')).toBe('Недопустимый тип проблемы')
  })
  it('returns null for allowed value', () => {
    expect(validateProblemType('MEDICAL')).toBe(null)
    expect(validateProblemType('  FOOD  ')).toBe(null)
  })
})

describe('validatePriority', () => {
  it('returns error when empty', () => {
    expect(validatePriority('')).toBe('Выберите приоритет')
  })
  it('returns error for invalid value', () => {
    expect(validatePriority('URGENT')).toBe('Недопустимый приоритет')
  })
  it('returns null for allowed value', () => {
    expect(validatePriority('HIGH')).toBe(null)
    expect(validatePriority('  LOW  ')).toBe(null)
  })
})

describe('validateDistrict', () => {
  it('returns error when empty', () => {
    expect(validateDistrict('')).toBe('Выберите район')
  })
  it('returns error for invalid value', () => {
    expect(validateDistrict('UNKNOWN')).toBe('Недопустимый район')
  })
  it('returns null for allowed value', () => {
    expect(validateDistrict('ALMALYNSKIY')).toBe(null)
    expect(validateDistrict('  BOSTANDYQ  ')).toBe(null)
  })
})
