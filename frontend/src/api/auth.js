import { fetchWithAuth, fetchWithAuthFormData, parseJsonResponse } from './client.js'

const AUTH = '/auth'

/**
 * Регистрация пользователя.
 * Бэк: POST /auth/register → 201 { message, user, token }
 * @param {Object} userData - { firstName, lastName, email, phone, password, role? }
 * @returns {Promise<{ message, user, token }>}
 */
export async function register(userData) {
  const res = await fetchWithAuth(`${AUTH}/register`, {
    method: 'POST',
    body: JSON.stringify({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      ...(userData.role && { role: userData.role }),
    }),
  })
  return parseJsonResponse(res)
}

/**
 * Вход в систему.
 * Бэк: POST /auth/login → 200 { message, user, token }
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ message, user, token }>}
 */
export async function login(email, password) {
  const res = await fetchWithAuth(`${AUTH}/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return parseJsonResponse(res)
}

/**
 * Обновить профиль текущего пользователя.
 * Бэк: PUT /auth/me → 200 { message, user }
 * @param {Object} profileData - { firstName?, lastName?, phone?, district?, telegramUsername? }
 * @returns {Promise<{ message, user }>}
 */
export async function updateProfile(profileData) {
  const body = {}
  if (profileData.firstName !== undefined) body.firstName = profileData.firstName
  if (profileData.lastName !== undefined) body.lastName = profileData.lastName
  if (profileData.phone !== undefined) body.phone = profileData.phone
  if (profileData.district !== undefined) body.district = profileData.district || null
  if (profileData.telegramUsername !== undefined) body.telegramUsername = profileData.telegramUsername || null
  const res = await fetchWithAuth(`${AUTH}/me`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return parseJsonResponse(res)
}

/**
 * Получить текущего пользователя по JWT.
 * Бэк: GET /auth/me, Authorization: Bearer <token> → 200 user
 * @param {string} [token] - если не передан, берётся из localStorage
 * @returns {Promise<Object>} user
 */
export async function getCurrentUser(token) {
  const opts = {}
  if (token) {
    opts.headers = { Authorization: `Bearer ${token}` }
  }
  const res = await fetchWithAuth(`${AUTH}/me`, {
    method: 'GET',
    ...opts,
  })
  const data = await parseJsonResponse(res)
  return data.user ?? data
}

/**
 * Запросить сброс пароля (отправка письма).
 * Бэк: POST /auth/forgot-password → 200 { message }
 * @param {string} email
 * @returns {Promise<{ message }>}
 */
export async function forgotPassword(email) {
  const res = await fetchWithAuth(`${AUTH}/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  return parseJsonResponse(res)
}

/**
 * Установить новый пароль по токену из письма.
 * Бэк: POST /auth/reset-password → 200 { message, user, token }
 * @param {string} token - RAW_TOKEN_FROM_LINK (из query reset-password.html?token=...)
 * @param {string} newPassword
 * @returns {Promise<{ message, user, token }>}
 */
export async function resetPassword(token, newPassword) {
  const res = await fetchWithAuth(`${AUTH}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
  return parseJsonResponse(res)
}

/**
 * Повторная отправка письма подтверждения email.
 * Бэк: POST /auth/resend-verification, Authorization: Bearer <token> → 200 { message }
 * @returns {Promise<{ message }>}
 */
export async function resendVerification() {
  const res = await fetchWithAuth(`${AUTH}/resend-verification`, {
    method: 'POST',
  })
  return parseJsonResponse(res)
}

/**
 * Загрузить аватар. Бэк: POST /auth/avatar, multipart/form-data, поле avatar.
 * @param {File} file - файл изображения (jpg, png, webp)
 * @returns {Promise<{ message, avatarUrl }>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await fetchWithAuthFormData(`${AUTH}/avatar`, formData)
  return parseJsonResponse(res)
}

/**
 * Удалить аккаунт текущего пользователя. Бэк: DELETE /auth/me, body: { password }.
 * После успеха нужно выйти и редиректнуть на логин.
 * @param {string} password
 * @returns {Promise<{ message }>}
 */
export async function deleteAccount(password) {
  const res = await fetchWithAuth(`${AUTH}/me`, {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
  return parseJsonResponse(res)
}
