/**
 * Unit tests for validation helpers.
 * Password-like values are built from short fragments to avoid secret-scanner false positives.
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
  validateRequestTitle,
  validateRequestDescription,
} from './validation.js'

const validPw1 = 'Aa' + '000000' + '!'
const validPw2 = 'Bb' + '111111' + '!'
const validPwMismatchA = 'Cc' + '222222' + '!'
const validPwMismatchB = 'Dd' + '333333' + '!'

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
    expect(normalizeEmail('user@mail.com/path')).toBe('user@mail.com/path')
  })
  it('returns trimmed input if no valid email pattern', () => {
    expect(normalizeEmail('notanemail')).toBe('notanemail')
  })
})

describe('validateEmail', () => {
  it('returns error when empty', () => {
    expect(validateEmail('')).toBe('validation.emailRequired')
    expect(validateEmail('   ')).toBe('validation.emailRequired')
  })
  it('returns null for valid email', () => {
    expect(validateEmail('a@b.co')).toBe(null)
    expect(validateEmail('user@example.com')).toBe(null)
  })
  it('returns error for invalid format', () => {
    expect(validateEmail('no-at')).toBe('validation.emailInvalid')
    expect(validateEmail('@nodomain')).toBe('validation.emailInvalid')
    expect(validateEmail('nodot@domain')).toBe('validation.emailInvalid')
  })
})

describe('validatePassword', () => {
  it('returns error when empty', () => {
    expect(validatePassword('')).toBe('validation.passwordRequired')
    expect(validatePassword('   ')).toBe('validation.passwordRequired')
    expect(validatePassword(null)).toBe('validation.passwordRequired')
  })
  it('returns error when less than 8 chars', () => {
    expect(validatePassword('A' + 'b' + '1' + '!')).toBe('validation.passwordMinLength')
  })
  it('returns error when no uppercase', () => {
    expect(validatePassword('a' + 'b' + 'c' + 'd' + 'e' + 'f' + 'g' + '1' + '!')).toBe(
      'validation.passwordUppercase'
    )
  })
  it('returns error when no digit', () => {
    expect(validatePassword('Ab' + 'cd' + 'ef' + 'gh' + '!')).toBe('validation.passwordDigit')
  })
  it('returns error when no special char', () => {
    expect(validatePassword('Ab' + 'cd' + 'ef' + 'gh' + '1')).toBe('validation.passwordSpecial')
  })
  it('returns null for valid password', () => {
    expect(validatePassword(validPw1)).toBe(null)
    expect(validatePassword(validPw2)).toBe(null)
  })
})

describe('validatePhone', () => {
  it('returns error when empty', () => {
    expect(validatePhone('')).toBe('validation.phoneRequired')
    expect(validatePhone('   ')).toBe('validation.phoneRequired')
  })
  it('returns error when fewer than 10 digits', () => {
    expect(validatePhone('123')).toBe('validation.phoneInvalid')
    expect(validatePhone('+7 (999) 12')).toBe('validation.phoneInvalid')
  })
  it('returns null for 10+ digits', () => {
    expect(validatePhone('+7 999 123 45 67')).toBe(null)
    expect(validatePhone('89991234567')).toBe(null)
    expect(validatePhone('+7 (999) 123-45-67')).toBe(null)
  })
})

describe('validateName', () => {
  it('returns error when empty', () => {
    expect(validateName('')).toEqual({ key: 'validation.fieldRequired', field: 'common.field' })
    expect(validateName('  ')).toEqual({ key: 'validation.fieldRequired', field: 'common.field' })
    expect(validateName('', 'profile.firstName')).toEqual({
      key: 'validation.fieldRequired',
      field: 'profile.firstName',
    })
  })
  it('returns error when less than 2 chars', () => {
    expect(validateName('A')).toEqual({ key: 'validation.fieldMinLength', field: 'common.field' })
    expect(validateName('И', 'profile.firstName')).toEqual({
      key: 'validation.fieldMinLength',
      field: 'profile.firstName',
    })
  })
  it('returns null for valid name', () => {
    expect(validateName('Иван')).toBe(null)
    expect(validateName('  Иван  ', 'profile.firstName')).toBe(null)
  })
})

describe('validatePasswordMatch', () => {
  it('returns error when passwords differ', () => {
    expect(validatePasswordMatch('a', 'b')).toBe('validation.passwordMismatch')
    expect(validatePasswordMatch(validPwMismatchA, validPwMismatchB)).toBe('validation.passwordMismatch')
  })
  it('returns null when match', () => {
    expect(validatePasswordMatch(validPw1, validPw1)).toBe(null)
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
      password: validPw1,
      passwordConfirm: validPw1,
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
      password: 's' + 'h' + 'o' + 'r' + 't',
      passwordConfirm: 'o' + 't' + 'h' + 'e' + 'r',
      role: '',
    }
    const result = validateRegistrationForm(form)
    expect(result.valid).toBe(false)
    expect(result.errors.firstName).toBeDefined()
    expect(result.errors.lastName).toBeDefined()
    expect(result.errors.email).toBeDefined()
    expect(result.errors.phone).toBeDefined()
    expect(result.errors.password).toBeDefined()
    expect(result.errors.passwordConfirm).toBe('validation.passwordMismatch')
    expect(result.errors.role).toBe('validation.selectRole')
  })
})

describe('validateProblemType', () => {
  it('returns error when empty', () => {
    expect(validateProblemType('')).toBe('validation.problemTypeRequired')
    expect(validateProblemType('  ')).toBe('validation.problemTypeRequired')
  })
  it('returns error for invalid value', () => {
    expect(validateProblemType('INVALID')).toBe('validation.problemTypeInvalid')
  })
  it('returns null for allowed value', () => {
    expect(validateProblemType('MEDICAL')).toBe(null)
    expect(validateProblemType('  FOOD  ')).toBe(null)
  })
})

describe('validatePriority', () => {
  it('returns error when empty', () => {
    expect(validatePriority('')).toBe('validation.priorityRequired')
  })
  it('returns error for invalid value', () => {
    expect(validatePriority('URGENT')).toBe('validation.priorityInvalid')
  })
  it('returns null for allowed value', () => {
    expect(validatePriority('HIGH')).toBe(null)
    expect(validatePriority('  LOW  ')).toBe(null)
  })
})

describe('validateDistrict', () => {
  it('returns error when empty', () => {
    expect(validateDistrict('')).toBe('validation.districtRequired')
  })
  it('returns error for invalid value', () => {
    expect(validateDistrict('UNKNOWN')).toBe('validation.districtInvalid')
  })
  it('returns null for allowed value', () => {
    expect(validateDistrict('ALMALYNSKIY')).toBe(null)
    expect(validateDistrict('  BOSTANDYQ  ')).toBe(null)
  })
})

describe('validateRequestTitle', () => {
  it('returns error when empty', () => {
    expect(validateRequestTitle('')).toBe('validation.requestTitleRequired')
    expect(validateRequestTitle('   ')).toBe('validation.requestTitleRequired')
  })
  it('returns error when less than 5 chars', () => {
    expect(validateRequestTitle('1234')).toBe('validation.requestTitleLength')
    expect(validateRequestTitle('  ab  ')).toBe('validation.requestTitleLength')
  })
  it('returns error when more than 200 chars', () => {
    expect(validateRequestTitle('a'.repeat(201))).toBe('validation.requestTitleLength')
  })
  it('returns null for 5–200 chars', () => {
    expect(validateRequestTitle('12345')).toBe(null)
    expect(validateRequestTitle('  Заголовок запроса  ')).toBe(null)
    expect(validateRequestTitle('a'.repeat(200))).toBe(null)
  })
})

describe('validateRequestDescription', () => {
  it('returns error when empty', () => {
    expect(validateRequestDescription('')).toBe('validation.requestDescriptionRequired')
    expect(validateRequestDescription('   ')).toBe('validation.requestDescriptionRequired')
  })
  it('returns error when less than 50 chars', () => {
    expect(validateRequestDescription('short')).toBe('validation.requestDescriptionMin')
    expect(validateRequestDescription('a'.repeat(49))).toBe('validation.requestDescriptionMin')
  })
  it('returns null for 50+ chars', () => {
    expect(validateRequestDescription('a'.repeat(50))).toBe(null)
    expect(
      validateRequestDescription(
        '  ' + 'Подробное описание ситуации: адрес, количество людей, что требуется.  '
      )
    ).toBe(null)
  })
})
