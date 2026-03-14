import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth.js'

const ADMIN_ROLE = 'ADMIN'

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
  const isAdmin = computed(() => user.value?.role === ADMIN_ROLE)

  function setAuth(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    if (newToken) localStorage.setItem('token', newToken)
    else localStorage.removeItem('token')
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser))
    else localStorage.removeItem('user')
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
    login,
    logout,
    setAuth,
    fetchUser,
    init,
  }
})
