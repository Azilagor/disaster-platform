<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info-section">
        <div class="profile-avatar-wrapper">
          <img
            v-if="authStore.userAvatar"
            :src="authStore.userAvatar"
            alt=""
            class="profile-avatar"
            width="120"
            height="120"
          />
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="avatar-input-hidden"
            @change="onAvatarFileChange"
          />
          <button
            type="button"
            class="avatar-upload-btn"
            title="Сменить фото"
            :disabled="avatarUploading"
            @click="triggerAvatarInput"
          >
            <svg
              v-if="!avatarUploading"
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M16 2L20 6L16 10" />
              <path d="M4 18v-4M4 14L2 16l-2-2" />
              <circle cx="10" cy="10" r="8" />
            </svg>
            <span v-else class="avatar-upload-spinner">...</span>
          </button>
        </div>
        <div class="profile-header-info">
          <h1>{{ authStore.userName }}</h1>
          <p class="profile-role">{{ authStore.userRole }}</p>
          <div class="profile-meta">
            <span class="meta-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M4 4h12v12H4z" />
                <path d="M16 8l-4 4-2-2-4 4" />
              </svg>
              {{ authStore.user?.email ?? '—' }}
            </span>
            <span class="meta-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M18 15v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
                <path d="M10 2v12M4 8l6 6 6-6" />
              </svg>
              {{ authStore.user?.phone || '—' }}
            </span>
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary btn-sm">Редактировать профиль</button>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-left-column">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Личные данные</h2>
          </div>
          <form class="profile-form" @submit.prevent="saveProfile">
            <div class="form-grid">
              <div class="form-group">
                <label for="profile-firstName">Имя</label>
                <input
                  id="profile-firstName"
                  v-model="profileForm.firstName"
                  type="text"
                  class="form-control"
                  minlength="2"
                  required
                />
              </div>
              <div class="form-group">
                <label for="profile-lastName">Фамилия</label>
                <input
                  id="profile-lastName"
                  v-model="profileForm.lastName"
                  type="text"
                  class="form-control"
                  minlength="2"
                  required
                />
              </div>
              <div class="form-group">
                <label for="profile-phone">Телефон</label>
                <input
                  id="profile-phone"
                  v-model="profileForm.phone"
                  type="tel"
                  class="form-control"
                  placeholder="+7..."
                />
              </div>
              <div class="form-group">
                <label for="profile-district">Район</label>
                <select id="profile-district" v-model="profileForm.district" class="form-control">
                  <option value="">— не указан —</option>
                  <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] ?? d }}</option>
                </select>
              </div>
              <div class="form-group form-group-full">
                <label for="profile-telegram">Telegram</label>
                <input
                  id="profile-telegram"
                  v-model="profileForm.telegramUsername"
                  type="text"
                  class="form-control"
                  placeholder="@username или username"
                />
                <span v-if="profileError" class="form-error">{{ profileError }}</span>
                <span v-if="profileSuccess" class="form-success">{{ profileSuccess }}</span>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="profileSaving">Сохранить</button>
            </div>
          </form>
          <div class="info-list profile-readonly-meta" style="padding: 0 var(--spacing-xl) var(--spacing-xl)">
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ authStore.user?.email ?? '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Роль</span>
              <span class="info-value">{{ authStore.userRole }}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Статистика</h2>
          </div>
          <div class="profile-stats" style="padding: var(--spacing-xl)">
            <div class="profile-stat-item">
              <div class="stat-icon stat-icon-blue">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ myRequests.length }}</div>
                <div class="stat-label">Созданных запросов</div>
              </div>
            </div>
            <div class="profile-stat-item">
              <div class="stat-icon stat-icon-green">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">8</div>
                <div class="stat-label">Выполнено (как волонтёр)</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Мои заявки</h2>
          </div>
          <div v-if="myRequestsLoading" class="profile-requests-loading">Загрузка...</div>
          <div v-else-if="myRequestsError" class="profile-requests-error">{{ myRequestsError }}</div>
          <div v-else-if="myRequests.length === 0" class="profile-requests-empty">
            Вы пока не создавали заявок. <router-link to="/create-request">Создать запрос</router-link>
          </div>
          <ul v-else class="profile-requests-list">
            <li v-for="req in myRequests" :key="req.id" class="profile-request-item">
              <router-link :to="'/map?request=' + req.id" class="profile-request-link">
                <span class="profile-request-title">{{ req.title }}</span>
                <span class="profile-request-meta">
                  {{ problemTypeLabels[req.problemType] ?? req.problemType }} ·
                  {{ priorityLabels[req.priority] ?? req.priority }} ·
                  {{ statusLabels[req.status] ?? req.status }}
                </span>
                <span class="profile-request-address">{{ req.address }}</span>
              </router-link>
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Навыки</h2>
          </div>
          <div style="padding: var(--spacing-xl)">
            <div class="skills-grid">
              <span v-for="s in skills" :key="s" class="skill-badge-large">{{ s }}</span>
            </div>
          </div>
        </div>
        <div class="card card-danger-zone">
          <div class="card-header">
            <h2 class="card-title">Удалить аккаунт</h2>
          </div>
          <div class="danger-zone-content">
            <p>Удаление аккаунта необратимо. Будут удалены ваши заявки и привязки.</p>
            <div v-if="deleteAccountError" class="auth-message auth-message-error">{{ deleteAccountError }}</div>
            <form class="delete-account-form" @submit.prevent="submitDeleteAccount">
              <div class="form-group">
                <label for="delete-password">Введите пароль для подтверждения</label>
                <input
                  id="delete-password"
                  v-model="deletePassword"
                  type="password"
                  class="form-control"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
              </div>
              <label class="checkbox-label">
                <input v-model="deleteConfirm" type="checkbox" />
                <span>Я понимаю, что аккаунт и данные будут удалены безвозвратно</span>
              </label>
              <button
                type="submit"
                class="btn btn-danger"
                :disabled="!deleteConfirm || !deletePassword.trim() || deleteAccountSaving"
              >
                {{ deleteAccountSaving ? 'Удаление...' : 'Удалить аккаунт' }}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div class="profile-right-column">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Активность</h2>
          </div>
          <div class="timeline" style="padding: var(--spacing-xl)">
            <div v-for="a in timeline" :key="a.id" class="timeline-item">
              <div class="timeline-marker" :class="a.type"></div>
              <div class="timeline-content">
                <p class="timeline-text" v-html="a.text"></p>
                <span class="timeline-time">{{ a.time }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Достижения</h2>
          </div>
          <div class="achievements-grid" style="padding: var(--spacing-xl)">
            <div
              v-for="ach in achievements"
              :key="ach.id"
              class="achievement-item"
              :class="{ locked: !ach.unlocked }"
            >
              <div class="achievement-icon">🏅</div>
              <div class="achievement-info">
                <h4>{{ ach.title }}</h4>
                <p>{{ ach.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getMyRequests } from '../api/requests.js'
import { updateProfile, uploadAvatar, deleteAccount } from '../api/auth.js'
import { PROBLEM_TYPE_LABELS, PRIORITY_LABELS, ALLOWED_DISTRICTS, DISTRICT_LABELS } from '../constants/requests.js'

const router = useRouter()
const authStore = useAuthStore()
const avatarInputRef = ref(null)
const avatarUploading = ref(false)

function triggerAvatarInput() {
  if (avatarInputRef.value) avatarInputRef.value.click()
}

async function onAvatarFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    profileError.value = 'Допустимы только JPG, PNG или WebP'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    profileError.value = 'Размер файла не более 2 МБ'
    return
  }
  e.target.value = ''
  profileError.value = ''
  avatarUploading.value = true
  try {
    const { avatarUrl } = await uploadAvatar(file)
    authStore.setAuth(authStore.token, { ...authStore.user, avatarUrl })
  } catch (err) {
    profileError.value = err.message || 'Не удалось загрузить фото'
  } finally {
    avatarUploading.value = false
  }
}

const profileForm = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  district: '',
  telegramUsername: '',
})
const profileSaving = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

const deletePassword = ref('')
const deleteConfirm = ref(false)
const deleteAccountSaving = ref(false)
const deleteAccountError = ref('')

async function submitDeleteAccount() {
  if (!deleteConfirm.value || !deletePassword.value.trim()) return
  deleteAccountError.value = ''
  deleteAccountSaving.value = true
  try {
    await deleteAccount(deletePassword.value)
    authStore.logout()
    router.push('/')
  } catch (err) {
    deleteAccountError.value = err.message || 'Не удалось удалить аккаунт'
  } finally {
    deleteAccountSaving.value = false
  }
}

function syncProfileForm() {
  const u = authStore.user
  profileForm.firstName = u?.firstName ?? ''
  profileForm.lastName = u?.lastName ?? ''
  profileForm.phone = u?.phone ?? ''
  profileForm.district = u?.district ?? ''
  profileForm.telegramUsername = u?.telegramUsername ?? ''
}

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  profileSaving.value = true
  try {
    const { user: updated } = await updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim() || undefined,
      district: profileForm.district || undefined,
      telegramUsername: profileForm.telegramUsername.trim() || undefined,
    })
    authStore.setAuth(authStore.token, updated)
    profileSuccess.value = 'Профиль сохранён'
    setTimeout(() => { profileSuccess.value = '' }, 3000)
  } catch (e) {
    profileError.value = e.message || 'Не удалось сохранить профиль'
  } finally {
    profileSaving.value = false
  }
}

watch(() => authStore.user, syncProfileForm, { deep: true })

const myRequests = ref([])
const myRequestsLoading = ref(true)
const myRequestsError = ref('')

const problemTypeLabels = PROBLEM_TYPE_LABELS
const priorityLabels = PRIORITY_LABELS
const statusLabels = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELLED: 'Отменён',
}

onMounted(async () => {
  syncProfileForm()
  try {
    myRequests.value = await getMyRequests()
  } catch (e) {
    myRequestsError.value = e.message || 'Не удалось загрузить заявки'
  } finally {
    myRequestsLoading.value = false
  }
})

const skills = ref(['Первая помощь', 'Логистика'])
const timeline = ref([
  {
    id: 1,
    type: 'success',
    text: 'Выполнен запрос <strong>#1247</strong> — медицинская помощь.',
    time: '2 ч назад',
  },
  {
    id: 2,
    type: 'info',
    text: 'Назначен на запрос <strong>#1248</strong> — эвакуация.',
    time: 'Вчера, 14:30',
  },
  {
    id: 3,
    type: 'warning',
    text: 'Запрос <strong>#1240</strong> отменён координатором.',
    time: 'Вчера, 10:00',
  },
])
const achievements = ref([
  { id: 1, title: 'Первый отклик', description: 'Откликнулся на первый запрос', unlocked: true },
  { id: 2, title: '10 выполненных заданий', description: 'Выполнил 10 запросов', unlocked: true },
  { id: 3, title: 'Герой недели', description: 'Топ-3 волонтёра за неделю', unlocked: false },
])
</script>

<style scoped>
.avatar-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.avatar-upload-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.card-danger-zone .card-title {
  color: var(--red-600, #dc2626);
}
.danger-zone-content {
  padding: var(--spacing-xl);
}
.delete-account-form .form-group {
  margin-bottom: 1rem;
}
.btn-danger {
  background: var(--red-600, #dc2626);
  color: white;
  border: none;
}
.btn-danger:hover:not(:disabled) {
  background: var(--red-700, #b91c1c);
}
</style>
