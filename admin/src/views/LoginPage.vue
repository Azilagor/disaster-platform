<template>
  <div class="auth-page">
    <div class="auth-box">
      <h1>Админка</h1>
      <p>Вход только для администраторов</p>
      <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" class="form-control" required placeholder="admin@example.com" />
        </div>
        <div class="form-group">
          <label for="password">Пароль</label>
          <input id="password" v-model="password" type="password" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--spacing-md);" :disabled="loading">
          {{ loading ? 'Вход…' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import * as authApi from '../api/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  if (route.query.error === 'admin_only') {
    errorMessage.value = 'Доступ только для администраторов. Ваша роль не позволяет войти в админку.'
  }
})

async function handleLogin() {
  errorMessage.value = ''
  const e = email.value.trim().toLowerCase()
  const p = password.value
  if (!e || !p) {
    errorMessage.value = 'Введите email и пароль'
    return
  }
  loading.value = true
  try {
    const data = await authApi.login(e, p)
    authStore.login(data)
    if (data.user?.role !== 'ADMIN') {
      authStore.logout()
      errorMessage.value = 'Доступ только для администраторов.'
      return
    }
    router.push('/')
  } catch (err) {
    errorMessage.value = err.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>
