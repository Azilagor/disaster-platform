import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth.js'
import { getUploadsFullUrl } from '../api/config.js'
import { i18n } from '../i18n/index.js'

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
  const isAdmin = computed(() => (user.value?.role || '').toUpperCase() === 'ADMIN')

  const userName = computed(() => {
    i18n.global.locale.value
    const fallback = i18n.global.t('roles.default')
    if (!user.value) return fallback
    const { firstName, lastName } = user.value
    return [firstName, lastName].filter(Boolean).join(' ') || fallback
  })

  const userRole = computed(() => {
    i18n.global.locale.value
    const fallback = i18n.global.t('roles.default')
    if (!user.value?.role) return fallback
    const r = String(user.value.role).toUpperCase()
    const key = `roles.${r}`
    return i18n.global.te(key) ? i18n.global.t(key) : fallback
  })

  const userAvatar = computed(() => {
    if (user.value?.avatarUrl) return getUploadsFullUrl(user.value.avatarUrl)
    if (user.value?.email) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.value.email)}`
    }
    return ''
  })

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
    isAdmin,
    userName,
    userRole,
    userAvatar,
    login,
    logout,
    setAuth,
    fetchUser,
    init,
  }
})
