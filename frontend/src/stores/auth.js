import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth.js'

const ROLE_LABELS = {
  user: 'Пользователь',
  volunteer: 'Волонтёр',
  coordinator: 'Координатор'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(restoreUser())

  function restoreUser() {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const isAuthenticated = computed(() => !!token.value)

  const userName = computed(() => {
    if (!user.value) return 'Пользователь'
    const { firstName, lastName } = user.value
    return [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь'
  })

  const userRole = computed(() =>
    (user.value && ROLE_LABELS[user.value.role]) || 'Пользователь'
  )

  const userAvatar = computed(() =>
    user.value?.email
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.email)}`
      : ''
  )

  function setAuth(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }

  function login(credentials) {
    const { user: u, token: t } = credentials
    setAuth(t, u)
  }

  function logout() {
    setAuth(null, null)
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const u = await authApi.getCurrentUser(token.value)
      user.value = u
      localStorage.setItem('user', JSON.stringify(u))
      return u
    } catch {
      setAuth(null, null)
      return null
    }
  }

  /**
   * Вызвать при старте приложения: восстанавливает token/user из localStorage
   * и при наличии токена подтягивает пользователя с сервера (при 401 очищает сессию).
   */
  async function init() {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      token.value = null
      user.value = null
      return
    }
    token.value = storedToken
    user.value = restoreUser()
    await fetchUser()
  }

  return {
    token,
    user,
    isAuthenticated,
    userName,
    userRole,
    userAvatar,
    login,
    logout,
    setAuth,
    fetchUser,
    init
  }
})
