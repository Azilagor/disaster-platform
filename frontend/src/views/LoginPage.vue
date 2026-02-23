<template>
  <div class="auth-body">
    <div class="auth-container">
      <!-- Left Side - Form -->
      <div class="auth-form-section">
        <div class="auth-header">
          <router-link to="/" class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z" fill="#2563EB"/>
              <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>DisasterHelp</span>
          </router-link>
        </div>

        <!-- Messages -->
        <div v-if="errorMessage" class="auth-message auth-message-error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="auth-message auth-message-success">{{ successMessage }}</div>

        <!-- Login Form -->
        <div class="auth-form-wrapper" v-show="isLoginMode">
          <div class="form-header">
            <h1>Вход в систему</h1>
            <p>Введите свои учётные данные для доступа</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input 
                type="email" 
                id="login-email" 
                v-model="loginForm.email"
                class="form-control" 
                :class="{ 'is-invalid': loginErrors.email }"
                placeholder="your@email.com"
                required
              >
              <span v-if="loginErrors.email" class="form-error">{{ loginErrors.email }}</span>
            </div>

            <div class="form-group">
              <label for="login-password">Пароль</label>
              <input 
                type="password" 
                id="login-password" 
                v-model="loginForm.password"
                class="form-control" 
                :class="{ 'is-invalid': loginErrors.password }"
                placeholder="••••••••"
                required
              >
              <span v-if="loginErrors.password" class="form-error">{{ loginErrors.password }}</span>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="loginForm.remember">
                <span>Запомнить меня</span>
              </label>
              <a href="#" class="link" @click.prevent="showForgotPassword">Забыли пароль?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Войти
            </button>
          </form>

          <div class="form-footer">
            <p>Нет аккаунта? <a href="#" class="link" @click.prevent="toggleMode">Зарегистрироваться</a></p>
          </div>
        </div>

        <!-- Registration Form -->
        <div class="auth-form-wrapper" v-show="!isLoginMode">
          <div class="form-header">
            <h1>Создать аккаунт</h1>
            <p>Заполните форму для регистрации</p>
          </div>

          <form class="auth-form" @submit.prevent="handleRegister">
            <div class="form-row">
              <div class="form-group">
                <label for="reg-firstname">Имя</label>
                <input 
                  type="text" 
                  id="reg-firstname" 
                  v-model="registerForm.firstName"
                  class="form-control" 
                  :class="{ 'is-invalid': registerErrors.firstName }"
                  placeholder="Иван"
                  required
                >
                <span v-if="registerErrors.firstName" class="form-error">{{ registerErrors.firstName }}</span>
              </div>
              <div class="form-group">
                <label for="reg-lastname">Фамилия</label>
                <input 
                  type="text" 
                  id="reg-lastname" 
                  v-model="registerForm.lastName"
                  class="form-control" 
                  :class="{ 'is-invalid': registerErrors.lastName }"
                  placeholder="Иванов"
                  required
                >
                <span v-if="registerErrors.lastName" class="form-error">{{ registerErrors.lastName }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email">Email</label>
              <input 
                type="email" 
                id="reg-email" 
                v-model="registerForm.email"
                class="form-control" 
                :class="{ 'is-invalid': registerErrors.email }"
                placeholder="your@email.com"
                required
              >
              <span v-if="registerErrors.email" class="form-error">{{ registerErrors.email }}</span>
            </div>

            <div class="form-group">
              <label for="reg-phone">Телефон</label>
              <input 
                type="tel" 
                id="reg-phone" 
                v-model="registerForm.phone"
                class="form-control" 
                :class="{ 'is-invalid': registerErrors.phone }"
                placeholder="+7 (___) ___-__-__"
                required
              >
              <span v-if="registerErrors.phone" class="form-error">{{ registerErrors.phone }}</span>
            </div>

            <div class="form-group">
              <label for="reg-password">Пароль</label>
              <input 
                type="password" 
                id="reg-password" 
                v-model="registerForm.password"
                class="form-control" 
                :class="{ 'is-invalid': registerErrors.password }"
                placeholder="••••••••"
                required
              >
              <span v-if="registerErrors.password" class="form-error">{{ registerErrors.password }}</span>
            </div>

            <div class="form-group">
              <label for="reg-password-confirm">Подтвердите пароль</label>
              <input 
                type="password" 
                id="reg-password-confirm" 
                v-model="registerForm.passwordConfirm"
                class="form-control" 
                :class="{ 'is-invalid': registerErrors.passwordConfirm }"
                placeholder="••••••••"
                required
              >
              <span v-if="registerErrors.passwordConfirm" class="form-error">{{ registerErrors.passwordConfirm }}</span>
            </div>

            <div class="form-group">
              <label for="reg-role">Роль</label>
              <select 
                id="reg-role" 
                v-model="registerForm.role"
                class="form-control"
                :class="{ 'is-invalid': registerErrors.role }"
                required
              >
                <option value="">Выберите роль</option>
                <option value="user">Пользователь (нуждающийся в помощи)</option>
                <option value="volunteer">Волонтёр</option>
                <option value="coordinator">Координатор</option>
              </select>
              <span v-if="registerErrors.role" class="form-error">{{ registerErrors.role }}</span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="registerForm.agreeTerms" required>
                <span>Я согласен с <a href="#" class="link">условиями использования</a> и <a href="#" class="link">политикой конфиденциальности</a></span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Зарегистрироваться
            </button>
          </form>

          <div class="form-footer">
            <p>Уже есть аккаунт? <a href="#" class="link" @click.prevent="toggleMode">Войти</a></p>
          </div>
        </div>
      </div>

      <!-- Right Side - Info -->
      <div class="auth-info-section">
        <div class="auth-info-content">
          <h2>Добро пожаловать в DisasterHelp</h2>
          <p>Платформа для координации помощи при чрезвычайных ситуациях</p>
          <div class="info-features">
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.67 6.25L7.5 15.42L3.33 11.25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p>Быстрая координация помощи</p>
            </div>
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.67 6.25L7.5 15.42L3.33 11.25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p>Управление запросами и волонтёрами</p>
            </div>
            <div class="info-feature">
              <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.67 6.25L7.5 15.42L3.33 11.25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p>Отслеживание статусов в реальном времени</p>
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
import * as authApi from '../api/auth.js'
import { withLoading } from '../stores/loading.js'
import {
  trimValue,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRegistrationForm
} from '../utils/validation.js'

const router = useRouter()
const route = useRoute()
// Форма зависит от маршрута: /register — регистрация, /login — вход
const isLoginMode = computed(() => route.path !== '/register')
const errorMessage = ref('')
const successMessage = ref(route.query.verified ? 'Почта подтверждена. Войдите в систему.' : '')

// Ошибки валидации под полями
const loginErrors = ref({})
const registerErrors = ref({})

// Login form data
const loginForm = ref({
  email: '',
  password: '',
  remember: false
})

// Register form data
const registerForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  role: '',
  agreeTerms: false
})

// Переключение между входом и регистрацией (меняем URL)
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

// Handle login
const handleLogin = async () => {
  errorMessage.value = ''
  const email = normalizeEmail(loginForm.value.email)
  const password = trimValue(loginForm.value.password)
  loginForm.value.email = email
  loginForm.value.password = password

  const emailErr = validateEmail(email)
  const passwordErr = password ? null : 'Пароль обязателен'
  loginErrors.value = {
    email: emailErr || undefined,
    password: passwordErr || undefined
  }
  if (emailErr || passwordErr) return

  try {
    const { user, token } = await withLoading(() =>
      authApi.login(email, password)
    )
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (loginForm.value.remember) {
      localStorage.setItem('remember', '1')
    } else {
      localStorage.removeItem('remember')
    }
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Ошибка входа. Попробуйте снова.'
  }
}

// Handle registration
const handleRegister = async () => {
  errorMessage.value = ''
  const form = registerForm.value
  // Нормализация: убираем пробелы, email обрезаем по домену
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
        role: form.role || 'user'
      })
    )
    successMessage.value = message || 'Регистрация успешна. Проверьте почту для подтверждения.'
    toggleMode()
  } catch (error) {
    errorMessage.value = error.message || 'Ошибка регистрации. Попробуйте снова.'
  }
}

// Show forgot password
const showForgotPassword = () => {
  alert('Функция восстановления пароля будет реализована позже')
}
</script>

<style scoped>
/* Дополнительные стили, если нужны */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
