<template>
  <div class="auth-body">
    <div class="auth-container reset-password-container">
      <div class="auth-form-section">
        <div class="auth-header">
          <router-link to="/" class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z"
                fill="#2563EB"
              />
              <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>DisasterHelp</span>
          </router-link>
        </div>

        <div v-if="errorFromQuery" class="auth-form-wrapper">
          <h1>{{ errorFromQuery.title }}</h1>
          <p>{{ errorFromQuery.message }}</p>
          <div class="reset-password-links">
            <router-link to="/login" class="btn btn-primary">{{ $t('resetPassword.requestNew') }}</router-link>
            <router-link to="/login" class="btn btn-outline">{{ $t('resetPassword.toLogin') }}</router-link>
          </div>
        </div>
        <div v-else-if="!tokenFromQuery" class="auth-form-wrapper">
          <h1>{{ $t('resetPassword.badLinkTitle') }}</h1>
          <p>{{ $t('resetPassword.badLinkText') }}</p>
          <router-link to="/login" class="btn btn-primary">{{ $t('resetPassword.toLoginPage') }}</router-link>
        </div>

        <template v-else>
          <div v-if="success" class="auth-form-wrapper">
            <div class="auth-message auth-message-success">{{ success }}</div>
            <p>{{ $t('resetPassword.successLine') }}</p>
            <router-link to="/login" class="btn btn-primary">{{ $t('auth.signIn') }}</router-link>
          </div>

          <div v-else class="auth-form-wrapper">
            <h1>{{ $t('resetPassword.newPasswordTitle') }}</h1>
            <p>{{ $t('resetPassword.newPasswordIntro') }}</p>
            <div v-if="errorMessage" class="auth-message auth-message-error">
              {{ errorMessage }}
            </div>
            <form class="auth-form" @submit.prevent="handleSubmit">
              <div class="form-group">
                <label for="new-password">{{ $t('resetPassword.newPasswordLabel') }}</label>
                <input
                  id="new-password"
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': errors.password }"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                />
                <span v-if="errors.password" class="form-error">{{ fieldError('password') }}</span>
              </div>
              <div class="form-group">
                <label for="new-password-confirm">{{ $t('resetPassword.repeatPassword') }}</label>
                <input
                  id="new-password-confirm"
                  v-model="form.passwordConfirm"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': errors.passwordConfirm }"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                />
                <span v-if="errors.passwordConfirm" class="form-error">{{ fieldError('passwordConfirm') }}</span>
              </div>
              <button type="submit" class="btn btn-primary btn-block">{{ $t('resetPassword.savePassword') }}</button>
            </form>
            <p class="form-footer">
              <router-link to="/login" class="link">{{ $t('resetPassword.backToLogin') }}</router-link>
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as authApi from '../api/auth.js'
import { withLoading } from '../stores/loading.js'
import { useAuthStore } from '../stores/auth.js'
import { trimValue, validatePassword, validatePasswordMatch } from '../utils/validation.js'
import { translateValidationError } from '../utils/translateValidationError.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const tokenFromQuery = computed(() => route.query.token || '')

const errorFromQuery = computed(() => {
  const err = route.query.error
  if (err === 'invalidToken') {
    return {
      title: t('resetPassword.invalidTokenTitle'),
      message: t('resetPassword.invalidTokenMsg'),
    }
  }
  if (err === 'server') {
    return {
      title: t('resetPassword.serverTitle'),
      message: t('resetPassword.serverMsg'),
    }
  }
  return null
})

const form = ref({ password: '', passwordConfirm: '' })
const errors = ref({})
const errorMessage = ref('')
const success = ref('')

function fieldError(key) {
  return translateValidationError(errors.value[key], t)
}

const handleSubmit = async () => {
  errorMessage.value = ''
  const password = trimValue(form.value.password)
  const passwordConfirm = trimValue(form.value.passwordConfirm)
  form.value.password = password
  form.value.passwordConfirm = passwordConfirm

  const passwordErr = validatePassword(password)
  const confirmErr = validatePasswordMatch(password, passwordConfirm)
  errors.value = {
    password: passwordErr || undefined,
    passwordConfirm: confirmErr || undefined,
  }
  if (passwordErr || confirmErr) return

  try {
    const result = await withLoading(() => authApi.resetPassword(tokenFromQuery.value, password))
    if (result.user && result.token) {
      authStore.login({ user: result.user, token: result.token })
      success.value = t('resetPassword.successChanged')
      router.push('/dashboard')
    } else {
      success.value = t('resetPassword.successLogin')
      router.push('/login')
    }
  } catch (error) {
    errorMessage.value = error.message || t('resetPassword.saveError')
  }
}
</script>

<style scoped>
.reset-password-container {
  max-width: 440px;
}
.auth-form-wrapper h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}
.auth-form-wrapper p {
  margin: 0 0 1rem;
  color: #666;
  font-size: 0.95rem;
}
.form-footer {
  margin-top: 1rem;
  text-align: center;
}
.form-footer .link {
  color: var(--primary, #2563eb);
  text-decoration: none;
}
.form-footer .link:hover {
  text-decoration: underline;
}
.reset-password-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
