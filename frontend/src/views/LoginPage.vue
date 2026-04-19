<template>
  <div class="auth-body">
    <div class="auth-container">
      <div class="auth-form-section">
        <div class="auth-header auth-header-top">
          <router-link to="/" class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z"
                fill="#2563EB"
              />
              <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span>{{ $t('brand.name') }}</span>
          </router-link>
          <LanguageSwitcher class="login-lang-switcher" />
        </div>

        <div v-if="errorMessage" class="auth-message auth-message-error">{{ trMsg(errorMessage) }}</div>
        <div v-if="successMessage" class="auth-message auth-message-success">
          {{ trMsg(successMessage) }}
        </div>

        <div v-show="isLoginMode" class="auth-form-wrapper">
          <div class="form-header">
            <h1>{{ $t('auth.loginTitle') }}</h1>
            <p>{{ $t('auth.loginSubtitle') }}</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-email">{{ $t('common.email') }}</label>
              <input
                id="login-email"
                v-model="loginForm.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': loginErrors.email }"
                :placeholder="$t('auth.emailPlaceholder')"
                required
              />
              <span v-if="loginErrors.email" class="form-error">{{ trMsg(loginErrors.email) }}</span>
            </div>

            <div class="form-group">
              <label for="login-password">{{ $t('common.password') }}</label>
              <input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': loginErrors.password }"
                :placeholder="$t('auth.passwordPlaceholder')"
                required
              />
              <span v-if="loginErrors.password" class="form-error">{{ trMsg(loginErrors.password) }}</span>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input v-model="loginForm.remember" type="checkbox" />
                <span>{{ $t('auth.rememberMe') }}</span>
              </label>
              <a href="#" class="link" @click.prevent="showForgotPassword">{{ $t('auth.forgotPassword') }}</a>
            </div>

            <button type="submit" class="btn btn-primary btn-block">{{ $t('auth.signIn') }}</button>
          </form>

          <div class="form-footer">
            <p>
              {{ $t('auth.noAccount') }}
              <a href="#" class="link" @click.prevent="toggleMode">{{ $t('auth.signUpLink') }}</a>
            </p>
          </div>
        </div>

        <div v-if="showForgotModal" class="modal-overlay" @click.self="closeForgotModal">
          <div class="modal forgot-modal">
            <div class="modal-header">
              <h2>{{ $t('auth.forgotTitle') }}</h2>
              <button
                type="button"
                class="modal-close"
                :aria-label="$t('common.close')"
                @click="closeForgotModal"
              >
                &times;
              </button>
            </div>
            <p class="modal-desc">
              {{ $t('auth.forgotDesc') }}
            </p>
            <div v-if="forgotError" class="auth-message auth-message-error">{{ trMsg(forgotError) }}</div>
            <div v-if="forgotSuccess" class="auth-message auth-message-success">
              {{ trMsg(forgotSuccess) }}
            </div>
            <form v-if="!forgotSuccess" class="auth-form" @submit.prevent="handleForgotPassword">
              <div class="form-group">
                <label for="forgot-email">{{ $t('common.email') }}</label>
                <input
                  id="forgot-email"
                  v-model="forgotForm.email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': forgotErrors.email }"
                  :placeholder="$t('auth.emailPlaceholder')"
                  required
                />
                <span v-if="forgotErrors.email" class="form-error">{{ trMsg(forgotErrors.email) }}</span>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" @click="closeForgotModal">
                  {{ $t('common.cancel') }}
                </button>
                <button type="submit" class="btn btn-primary">{{ $t('auth.send') }}</button>
              </div>
            </form>
            <div v-else class="modal-actions">
              <button type="button" class="btn btn-primary" @click="closeForgotModal">
                {{ $t('common.close') }}
              </button>
            </div>
          </div>
        </div>

        <div v-show="!isLoginMode" class="auth-form-wrapper">
          <div class="form-header">
            <h1>{{ $t('auth.registerTitle') }}</h1>
            <p>{{ $t('auth.registerSubtitle') }}</p>
          </div>

          <form class="auth-form" @submit.prevent="handleRegister">
            <div class="form-row">
              <div class="form-group">
                <label for="reg-firstname">{{ $t('auth.firstName') }}</label>
                <input
                  id="reg-firstname"
                  v-model="registerForm.firstName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': registerErrors.firstName }"
                  placeholder="Иван"
                  required
                />
                <span v-if="registerErrors.firstName" class="form-error">{{
                  trMsg(registerErrors.firstName)
                }}</span>
              </div>
              <div class="form-group">
                <label for="reg-lastname">{{ $t('auth.lastName') }}</label>
                <input
                  id="reg-lastname"
                  v-model="registerForm.lastName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': registerErrors.lastName }"
                  placeholder="Иванов"
                  required
                />
                <span v-if="registerErrors.lastName" class="form-error">{{
                  trMsg(registerErrors.lastName)
                }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email">{{ $t('common.email') }}</label>
              <input
                id="reg-email"
                v-model="registerForm.email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.email }"
                :placeholder="$t('auth.emailPlaceholder')"
                required
              />
              <span v-if="registerErrors.email" class="form-error">{{ trMsg(registerErrors.email) }}</span>
            </div>

            <div class="form-group">
              <label for="reg-phone">{{ $t('common.phone') }}</label>
              <input
                id="reg-phone"
                v-model="registerForm.phone"
                type="tel"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.phone }"
                placeholder="+7 (___) ___-__-__"
                required
              />
              <span v-if="registerErrors.phone" class="form-error">{{ trMsg(registerErrors.phone) }}</span>
            </div>

            <div class="form-group">
              <label for="reg-password">{{ $t('common.password') }}</label>
              <input
                id="reg-password"
                v-model="registerForm.password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.password }"
                :placeholder="$t('auth.passwordPlaceholder')"
                required
              />
              <span v-if="registerErrors.password" class="form-error">{{
                trMsg(registerErrors.password)
              }}</span>
            </div>

            <div class="form-group">
              <label for="reg-password-confirm">{{ $t('auth.confirmPassword') }}</label>
              <input
                id="reg-password-confirm"
                v-model="registerForm.passwordConfirm"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.passwordConfirm }"
                :placeholder="$t('auth.passwordPlaceholder')"
                required
              />
              <span v-if="registerErrors.passwordConfirm" class="form-error">{{
                trMsg(registerErrors.passwordConfirm)
              }}</span>
            </div>

            <div class="form-group">
              <label for="reg-role">{{ $t('auth.role') }}</label>
              <select
                id="reg-role"
                v-model="registerForm.role"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.role }"
                required
              >
                <option value="">{{ $t('auth.selectRole') }}</option>
                <option value="user">{{ $t('auth.roleUser') }}</option>
                <option value="volunteer">{{ $t('auth.roleVolunteer') }}</option>
                <option value="coordinator">{{ $t('auth.roleCoordinator') }}</option>
              </select>
              <span v-if="registerErrors.role" class="form-error">{{ trMsg(registerErrors.role) }}</span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="registerForm.agreeTerms" type="checkbox" required />
                <span
                  ><a href="#" class="link">{{ $t('auth.terms') }}</a> ·
                  <a href="#" class="link">{{ $t('auth.privacy') }}</a></span
                >
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block">{{ $t('auth.registerSubmit') }}</button>
          </form>

          <div class="form-footer">
            <p>{{ $t('auth.hasAccount') }} <a href="#" class="link" @click.prevent="toggleMode">{{ $t('auth.signInLink') }}</a></p>
          </div>
        </div>
      </div>

      <div class="auth-info-section">
        <div class="auth-info-content">
          <h2>{{ $t('auth.welcomeTitle') }}</h2>
          <p>{{ $t('auth.welcomeSubtitle') }}</p>
          <div class="info-features">
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M16.67 6.25L7.5 15.42L3.33 11.25"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <p>{{ $t('auth.feat1') }}</p>
            </div>
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M16.67 6.25L7.5 15.42L3.33 11.25"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <p>{{ $t('auth.feat2') }}</p>
            </div>
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M16.67 6.25L7.5 15.42L3.33 11.25"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <p>{{ $t('auth.feat3') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as authApi from '../api/auth.js'
import { withLoading } from '../stores/loading.js'
import { useAuthStore } from '../stores/auth.js'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import {
  trimValue,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRegistrationForm,
} from '../utils/validation.js'

const { t, te } = useI18n()

function trMsg(msg) {
  if (msg == null || msg === '') return ''
  const s = String(msg)
  if (te(s)) return t(s)
  return s
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isLoginMode = computed(() => route.path !== '/register')
const errorMessage = ref('')
const successMessage = ref(route.query.verified ? 'auth.verifiedSuccess' : '')

const loginErrors = ref({})
const registerErrors = ref({})

const loginForm = ref({
  email: '',
  password: '',
  remember: false,
})

const registerForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  role: '',
  agreeTerms: false,
})

const toggleMode = () => {
  errorMessage.value = ''
  loginErrors.value = {}
  registerErrors.value = {}
  if (route.path === '/register') {
    router.push('/login')
  } else {
    successMessage.value = ''
    router.push('/register')
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  const email = normalizeEmail(loginForm.value.email)
  const password = trimValue(loginForm.value.password)
  loginForm.value.email = email
  loginForm.value.password = password

  const emailErr = validateEmail(email)
  const passwordErr = password ? null : 'validation.passwordRequired'
  loginErrors.value = {
    email: emailErr || undefined,
    password: passwordErr || undefined,
  }
  if (emailErr || passwordErr) return

  try {
    const { user, token } = await withLoading(() => authApi.login(email, password))
    authStore.login({ user, token })
    if (loginForm.value.remember) {
      localStorage.setItem('remember', '1')
    } else {
      localStorage.removeItem('remember')
    }
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'auth.loginError'
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  const form = registerForm.value
  form.firstName = trimValue(form.firstName)
  form.lastName = trimValue(form.lastName)
  form.email = normalizeEmail(form.email)
  form.phone = trimValue(form.phone)
  form.password = trimValue(form.password)
  form.passwordConfirm = trimValue(form.passwordConfirm)
  form.role = trimValue(form.role)

  const { valid, errors } = validateRegistrationForm(form)
  registerErrors.value = errors
  if (!valid) return

  try {
    const { message } = await withLoading(() =>
      authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role || 'user',
      })
    )
    successMessage.value = message || 'auth.registerSuccess'
    toggleMode()
  } catch (error) {
    errorMessage.value = error.message || 'auth.registerError'
  }
}

const showForgotModal = ref(false)
const forgotForm = ref({ email: '' })
const forgotErrors = ref({})
const forgotError = ref('')
const forgotSuccess = ref('')

const showForgotPassword = () => {
  forgotForm.value = { email: loginForm.value.email || '' }
  forgotErrors.value = {}
  forgotError.value = ''
  forgotSuccess.value = ''
  showForgotModal.value = true
}

const closeForgotModal = () => {
  showForgotModal.value = false
}

const handleForgotPassword = async () => {
  forgotError.value = ''
  const email = normalizeEmail(forgotForm.value.email)
  forgotForm.value.email = email
  const emailErr = validateEmail(email)
  forgotErrors.value = { email: emailErr || undefined }
  if (emailErr) return
  try {
    const { message } = await withLoading(() => authApi.forgotPassword(email))
    forgotSuccess.value = message || 'auth.forgotSent'
  } catch (error) {
    forgotError.value = error.message || 'auth.forgotError'
  }
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: var(--auth-bg, #fff);
  border-radius: 12px;
  max-width: 420px;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0 0.25rem;
}
.modal-close:hover {
  color: #1a1a1a;
}
.modal-desc {
  margin: 0 0 1rem;
  color: #666;
  font-size: 0.9rem;
}
.modal .auth-form {
  margin-bottom: 0;
}
.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.auth-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.login-lang-switcher {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
