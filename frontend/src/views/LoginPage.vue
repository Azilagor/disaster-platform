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
                placeholder="your@email.com"
                required
              >
            </div>

            <div class="form-group">
              <label for="login-password">Пароль</label>
              <input 
                type="password" 
                id="login-password" 
                v-model="loginForm.password"
                class="form-control" 
                placeholder="••••••••"
                required
              >
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

          <div class="form-divider">
            <span>или</span>
          </div>

          <div class="social-login">
            <button class="btn btn-social" @click="handleGoogleLogin">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M18.17 8.36H10V11.91H14.7C14.24 13.91 12.5 15 10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C11.27 5 12.41 5.47 13.29 6.24L15.84 3.69C14.23 2.24 12.21 1.36 10 1.36C5.03 1.36 1 5.39 1 10.36C1 15.33 5.03 19.36 10 19.36C14.97 19.36 19 15.33 19 10.36C19 9.69 18.93 9.03 18.79 8.4L18.17 8.36Z" fill="#4285F4"/>
              </svg>
              Войти через Google
            </button>
          </div>

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
                  placeholder="Иван"
                  required
                >
              </div>
              <div class="form-group">
                <label for="reg-lastname">Фамилия</label>
                <input 
                  type="text" 
                  id="reg-lastname" 
                  v-model="registerForm.lastName"
                  class="form-control" 
                  placeholder="Иванов"
                  required
                >
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email">Email</label>
              <input 
                type="email" 
                id="reg-email" 
                v-model="registerForm.email"
                class="form-control" 
                placeholder="your@email.com"
                required
              >
            </div>

            <div class="form-group">
              <label for="reg-phone">Телефон</label>
              <input 
                type="tel" 
                id="reg-phone" 
                v-model="registerForm.phone"
                class="form-control" 
                placeholder="+7 (___) ___-__-__"
                required
              >
            </div>

            <div class="form-group">
              <label for="reg-password">Пароль</label>
              <input 
                type="password" 
                id="reg-password" 
                v-model="registerForm.password"
                class="form-control" 
                placeholder="••••••••"
                required
              >
            </div>

            <div class="form-group">
              <label for="reg-password-confirm">Подтвердите пароль</label>
              <input 
                type="password" 
                id="reg-password-confirm" 
                v-model="registerForm.passwordConfirm"
                class="form-control" 
                placeholder="••••••••"
                required
              >
            </div>

            <div class="form-group">
              <label for="reg-role">Роль</label>
              <select 
                id="reg-role" 
                v-model="registerForm.role"
                class="form-control"
                required
              >
                <option value="">Выберите роль</option>
                <option value="user">Пользователь (нуждающийся в помощи)</option>
                <option value="volunteer">Волонтёр</option>
                <option value="coordinator">Координатор</option>
              </select>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoginMode = ref(true)

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

// Toggle between login and register
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
}

// Handle login
const handleLogin = async () => {
  console.log('Login attempt:', loginForm.value)
  
  // TODO: Здесь будет API вызов
  // Пока просто симуляция
  try {
    // Временная заглушка - сохраняем токен
    localStorage.setItem('token', 'fake-jwt-token')
    localStorage.setItem('user', JSON.stringify({
      email: loginForm.value.email,
      role: 'user'
    }))
    
    // Редирект на dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    alert('Ошибка входа. Попробуйте снова.')
  }
}

// Handle registration
const handleRegister = async () => {
  // Validate passwords match
  if (registerForm.value.password !== registerForm.value.passwordConfirm) {
    alert('Пароли не совпадают!')
    return
  }
  
  console.log('Registration attempt:', registerForm.value)
  
  // TODO: Здесь будет API вызов
  try {
    // Временная заглушка
    alert('Регистрация успешна! Войдите в систему.')
    toggleMode()
  } catch (error) {
    console.error('Registration error:', error)
    alert('Ошибка регистрации. Попробуйте снова.')
  }
}

// Handle Google login
const handleGoogleLogin = () => {
  console.log('Google login clicked')
  // TODO: Интеграция с Google OAuth
  alert('Google OAuth будет интегрирован позже')
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
