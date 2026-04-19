<template>
  <div class="profile-page">

    <!-- ── Шапка профиля ───────────────────────────────────── -->
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info-section">
        <div class="profile-avatar-block">
          <div
            class="profile-avatar-wrapper profile-avatar-clickable"
            :class="{ 'avatar-uploading': avatarUploading }"
            role="button"
            tabindex="0"
            title="Сменить фото"
            @click="triggerAvatarInput"
            @keydown.enter="triggerAvatarInput"
            @keydown.space.prevent="triggerAvatarInput"
          >
            <template v-if="avatarUploading">
              <div class="profile-avatar-placeholder profile-avatar-placeholder-loading">
                <span class="avatar-placeholder-text">...</span>
              </div>
            </template>
            <template v-else-if="avatarSrc && !avatarLoadError">
              <img :src="avatarSrc" alt="" class="profile-avatar" width="120" height="120" @error="avatarLoadError = true" />
            </template>
            <template v-else>
              <div class="profile-avatar-placeholder">
                <svg class="avatar-placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <span class="avatar-placeholder-text">Фото</span>
              </div>
            </template>
            <input ref="avatarInputRef" type="file" accept="image/jpeg,image/png,image/webp" class="avatar-input-hidden" @change="onAvatarFileChange" />
          </div>
          <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
          <p class="avatar-hint">JPG, PNG или WebP, до 2 МБ</p>
        </div>
        <div class="profile-header-info">
          <h1>{{ authStore.userName }}</h1>
          <p class="profile-role">{{ authStore.userRole }}</p>
          <div class="profile-meta">
            <span class="meta-badge">{{ authStore.user?.email ?? '—' }}</span>
            <span class="meta-badge">{{ authStore.user?.phone || '—' }}</span>
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary btn-sm" @click="openEditProfileModal">Редактировать профиль</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Вкладки ─────────────────────────────────────────── -->
    <div class="profile-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="profile-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon" v-html="tab.icon"></span>
        {{ tab.label }}
        <span v-if="tab.id === 'requests' && myRequests.length" class="tab-badge">{{ myRequests.length }}</span>
      </button>
    </div>

    <!-- ── Контент вкладок ─────────────────────────────────── -->
    <div class="profile-tab-content">

      <!-- Вкладка: Профиль -->
      <div v-show="activeTab === 'profile'" class="tab-pane">
        <div class="profile-content">
          <div class="profile-left-column">

            <!-- Личные данные -->
            <div class="card">
              <div class="card-header"><h2 class="card-title">Личные данные</h2></div>
              <form class="profile-form" @submit.prevent="saveProfile">
                <div class="form-grid">
                  <div class="form-group">
                    <label for="profile-firstName">Имя</label>
                    <input id="profile-firstName" v-model="profileForm.firstName" type="text" class="form-control" minlength="2" required />
                  </div>
                  <div class="form-group">
                    <label for="profile-lastName">Фамилия</label>
                    <input id="profile-lastName" v-model="profileForm.lastName" type="text" class="form-control" minlength="2" required />
                  </div>
                  <div class="form-group">
                    <label for="profile-phone">Телефон</label>
                    <input id="profile-phone" v-model="profileForm.phone" type="tel" class="form-control" placeholder="+7..." />
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
                    <input id="profile-telegram" v-model="profileForm.telegramUsername" type="text" class="form-control" placeholder="@username" />
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

            <!-- Статистика -->
            <div class="card">
              <div class="card-header"><h2 class="card-title">Статистика</h2></div>
              <div class="profile-stats" style="padding: var(--spacing-xl)">
                <div class="profile-stat-item">
                  <div class="stat-icon stat-icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ doneCount }}</div>
                    <div class="stat-label">Выполнено</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Навыки -->
            <div class="card">
              <div class="card-header"><h2 class="card-title">Навыки</h2></div>
              <div style="padding: var(--spacing-xl)">
                <div class="skills-grid">
                  <span v-for="s in skills" :key="s" class="skill-badge-large">{{ s }}</span>
                </div>
              </div>
            </div>

            <!-- Опасная зона -->
            <div class="card card-danger-zone">
              <div class="card-header"><h2 class="card-title">Удалить аккаунт</h2></div>
              <div class="danger-zone-content">
                <p>Удаление аккаунта необратимо. Будут удалены ваши заявки и привязки.</p>
                <div v-if="deleteAccountError" class="auth-message auth-message-error">{{ deleteAccountError }}</div>
                <form class="delete-account-form" @submit.prevent="submitDeleteAccount">
                  <div class="form-group">
                    <label for="delete-password">Введите пароль для подтверждения</label>
                    <input id="delete-password" v-model="deletePassword" type="password" class="form-control" placeholder="••••••••" autocomplete="current-password" />
                  </div>
                  <label class="checkbox-label">
                    <input v-model="deleteConfirm" type="checkbox" />
                    <span>Я понимаю, что аккаунт и данные будут удалены безвозвратно</span>
                  </label>
                  <button type="submit" class="btn btn-danger" :disabled="!deleteConfirm || !deletePassword.trim() || deleteAccountSaving">
                    {{ deleteAccountSaving ? 'Удаление...' : 'Удалить аккаунт' }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка: Мои заявки -->
      <div v-show="activeTab === 'requests'" class="tab-pane">
        <div class="requests-tab-header">
          <div>
            <h2>Мои заявки</h2>
            <p class="text-muted">Заявки, которые вы создали</p>
          </div>
          <router-link to="/create-request" class="btn btn-primary">+ Создать заявку</router-link>
        </div>

        <div v-if="myRequestsLoading" class="tab-loading">Загрузка...</div>
        <div v-else-if="myRequestsError" class="auth-message auth-message-error">{{ myRequestsError }}</div>
        <div v-else-if="myRequests.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>У вас пока нет заявок</p>
          <router-link to="/create-request" class="btn btn-primary">Создать первую заявку</router-link>
        </div>
        <div v-else class="requests-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Заголовок</th>
                <th>Тип</th>
                <th>Приоритет</th>
                <th>Район</th>
                <th>Статус</th>
                <th>Публикация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in myRequests" :key="r.id" class="request-row">
                <td class="td-id">{{ r.id }}</td>
                <td class="td-title">{{ r.title }}</td>
                <td>{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</td>
                <td>
                  <span class="priority-chip" :class="r.priority?.toLowerCase()">
                    {{ PRIORITY_LABELS[r.priority] || r.priority }}
                  </span>
                </td>
                <td>{{ DISTRICT_LABELS[r.district] || r.district }}</td>
                <td>
                  <span class="status-chip" :class="r.status?.toLowerCase()">
                    {{ STATUS_LABELS[r.status] || r.status }}
                  </span>
                </td>
                <td>
                  <span v-if="r.isPublished" class="badge badge-success">Опубликована</span>
                  <span v-else class="badge badge-secondary">Не опубликована</span>
                </td>
                <td>
                  <router-link :to="'/map?request=' + r.id" class="btn btn-sm btn-outline">На карте</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Вкладка: Активность -->
      <div v-show="activeTab === 'activity'" class="tab-pane">
        <div class="activity-grid">
          <div class="card">
            <div class="card-header"><h2 class="card-title">Активность</h2></div>
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
            <div class="card-header"><h2 class="card-title">Достижения</h2></div>
            <div class="achievements-grid" style="padding: var(--spacing-xl)">
              <div v-for="ach in achievements" :key="ach.id" class="achievement-item" :class="{ locked: !ach.unlocked }">
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

    <!-- ── Модалка редактирования email ───────────────────── -->
    <div v-if="editProfileModalOpen" class="modal-overlay" @click.self="editProfileModalOpen = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Редактировать профиль</h2>
          <button type="button" class="modal-close" @click="editProfileModalOpen = false">&times;</button>
        </div>
        <form class="modal-body" @submit.prevent="saveEditProfile">
          <p class="modal-hint">Контактные данные можно изменить в блоке «Личные данные».</p>
          <div class="form-group">
            <label for="edit-profile-email">Email</label>
            <input id="edit-profile-email" v-model="editProfileEmail" type="email" class="form-control" required placeholder="email@example.com" />
            <span v-if="editProfileError" class="form-error">{{ editProfileError }}</span>
            <span v-if="editProfileSuccess" class="form-success">{{ editProfileSuccess }}</span>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="editProfileModalOpen = false">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="editProfileSaving">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getMyRequests } from '../api/requests.js'
import { updateProfile, uploadAvatar, deleteAccount } from '../api/auth.js'
import {
  PROBLEM_TYPE_LABELS,
  PRIORITY_LABELS,
  ALLOWED_DISTRICTS,
  DISTRICT_LABELS,
} from '../constants/requests.js'

const router = useRouter()
const authStore = useAuthStore()

// ── Вкладки ───────────────────────────────────────────────────
const activeTab = ref('profile')
const tabs = [
  {
    id: 'profile',
    label: 'Профиль',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
  },
  {
    id: 'requests',
    label: 'Мои заявки',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  },
  {
    id: 'activity',
    label: 'Активность',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  },
]

// ── Аватар ────────────────────────────────────────────────────
const avatarInputRef = ref(null)
const avatarUploading = ref(false)
const avatarLoadError = ref(false)
const avatarError = ref('')
const avatarSrc = computed(() => authStore.userAvatar)
watch(avatarSrc, () => { avatarLoadError.value = false })

function triggerAvatarInput() {
  avatarInputRef.value?.click()
}

async function onAvatarFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    avatarError.value = 'Допустимы только JPG, PNG или WebP'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = 'Размер файла не более 2 МБ'
    return
  }
  e.target.value = ''
  avatarUploading.value = true
  try {
    const { avatarUrl } = await uploadAvatar(file)
    authStore.setAuth(authStore.token, { ...authStore.user, avatarUrl })
    avatarLoadError.value = false
  } catch (err) {
    avatarError.value = err.message || 'Не удалось загрузить фото'
  } finally {
    avatarUploading.value = false
  }
}

// ── Форма профиля ─────────────────────────────────────────────
const profileForm = reactive({ firstName: '', lastName: '', phone: '', district: '', telegramUsername: '' })
const profileSaving = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

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

// ── Модалка email ─────────────────────────────────────────────
const editProfileModalOpen = ref(false)
const editProfileEmail = ref('')
const editProfileSaving = ref(false)
const editProfileError = ref('')
const editProfileSuccess = ref('')

function openEditProfileModal() {
  editProfileEmail.value = authStore.user?.email ?? ''
  editProfileError.value = ''
  editProfileSuccess.value = ''
  editProfileModalOpen.value = true
}

async function saveEditProfile() {
  const email = editProfileEmail.value?.trim()
  if (!email) { editProfileError.value = 'Введите email'; return }
  editProfileError.value = ''
  editProfileSuccess.value = ''
  editProfileSaving.value = true
  try {
    const { user: updated } = await updateProfile({ email })
    authStore.setAuth(authStore.token, updated)
    editProfileSuccess.value = 'Email сохранён. Подтвердите новый email по ссылке из письма.'
    setTimeout(() => { editProfileModalOpen.value = false; editProfileSuccess.value = '' }, 2500)
  } catch (e) {
    editProfileError.value = e.message || 'Не удалось сохранить email'
  } finally {
    editProfileSaving.value = false
  }
}

// ── Удаление аккаунта ─────────────────────────────────────────
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

// ── Мои заявки ────────────────────────────────────────────────
const myRequests = ref([])
const myRequestsLoading = ref(true)
const myRequestsError = ref('')

const doneCount = computed(() => myRequests.value.filter(r => r.status === 'DONE').length)

const STATUS_LABELS = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнена',
  CANCELLED: 'Отменена',
}

// ── Активность и достижения ───────────────────────────────────
const skills = ref(['Первая помощь', 'Логистика'])
const timeline = ref([
  { id: 1, type: 'success', text: 'Выполнен запрос <strong>#1247</strong> — медицинская помощь.', time: '2 ч назад' },
  { id: 2, type: 'info',    text: 'Назначен на запрос <strong>#1248</strong> — эвакуация.', time: 'Вчера, 14:30' },
  { id: 3, type: 'warning', text: 'Запрос <strong>#1240</strong> отменён координатором.', time: 'Вчера, 10:00' },
])
const achievements = ref([
  { id: 1, title: 'Первый отклик', description: 'Откликнулся на первый запрос', unlocked: true },
  { id: 2, title: '10 выполненных заданий', description: 'Выполнил 10 запросов', unlocked: true },
  { id: 3, title: 'Герой недели', description: 'Топ-3 волонтёра за неделю', unlocked: false },
])

onMounted(async () => {
  syncProfileForm()
  try {
    myRequests.value = await getMyRequests({ limit: 100 })
  } catch (e) {
    myRequestsError.value = e.message || 'Не удалось загрузить заявки'
  } finally {
    myRequestsLoading.value = false
  }
})
</script>

<style scoped>
.avatar-input-hidden { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; }
.profile-avatar-clickable { cursor: pointer; }
.profile-avatar-clickable:hover { opacity: 0.95; }
.profile-avatar-clickable.avatar-uploading { pointer-events: none; opacity: 0.8; }
.profile-avatar-block { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
.profile-avatar-placeholder {
  width: 120px; height: 120px; border-radius: 50%;
  border: 4px solid var(--gray-200); background: var(--gray-100);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem;
}
.avatar-placeholder-icon { color: var(--gray-400); }
.avatar-placeholder-text { font-size: var(--font-size-sm); color: var(--gray-500); }
.profile-avatar-placeholder-loading .avatar-placeholder-text { animation: avatar-pulse 0.8s ease-in-out infinite; }
@keyframes avatar-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.avatar-error { color: #dc2626; font-size: var(--font-size-sm); margin: 0.25rem 0 0; }
.avatar-hint { font-size: var(--font-size-xs); color: var(--gray-500); margin: 0.25rem 0 0; }

/* ── Вкладки ───────────────────────────────────────────────── */
.profile-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 1.5rem;
  margin-top: 1.5rem;
  background: #fff;
}
.profile-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.profile-tab:hover { color: #374151; }
.profile-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
.tab-icon { display: flex; align-items: center; opacity: 0.7; }
.profile-tab.active .tab-icon { opacity: 1; }
.tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  background: #2563eb; color: white;
  border-radius: 10px; font-size: 0.75rem; font-weight: 600;
}

/* ── Контент вкладок ──────────────────────────────────────── */
.profile-tab-content { padding: 1.5rem; }
.tab-pane { }
.tab-loading { color: #6b7280; padding: 2rem 0; }

/* Профиль — сетка карточек */
.profile-content { display: flex; gap: 1.5rem; }
.profile-left-column { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; max-width: 680px; }

/* Мои заявки */
.requests-tab-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 1.25rem;
}
.requests-tab-header h2 { margin: 0; font-size: 1.25rem; }
.requests-table-wrap { overflow-x: auto; background: #fff; border-radius: 10px; border: 1px solid #e5e7eb; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; font-weight: 600; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
.request-row:last-child td { border-bottom: none; }
.request-row:hover td { background: #f9fafb; }
.td-id { color: #9ca3af; font-size: 0.85rem; }
.td-title { font-weight: 500; max-width: 240px; }

.priority-chip {
  display: inline-block; padding: 0.2rem 0.6rem;
  border-radius: 20px; font-size: 0.78rem; font-weight: 600;
}
.priority-chip.critical { background: #fee2e2; color: #991b1b; }
.priority-chip.high { background: #ffedd5; color: #9a3412; }
.priority-chip.medium { background: #fef9c3; color: #854d0e; }
.priority-chip.low { background: #dcfce7; color: #166534; }

.status-chip {
  display: inline-block; padding: 0.2rem 0.6rem;
  border-radius: 20px; font-size: 0.78rem; font-weight: 500;
}
.status-chip.new { background: #eff6ff; color: #1d4ed8; }
.status-chip.in_progress { background: #fef3c7; color: #92400e; }
.status-chip.done { background: #dcfce7; color: #166534; }
.status-chip.cancelled { background: #f3f4f6; color: #6b7280; }

.badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.badge-success { background: #d4edda; color: #155724; }
.badge-secondary { background: #e2e3e5; color: #383d41; }

.empty-state { padding: 3rem; text-align: center; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state p { color: #6b7280; margin-bottom: 1rem; }

/* Активность */
.activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 768px) { .activity-grid { grid-template-columns: 1fr; } }

/* Прочие стили */
.text-muted { color: #6b7280; font-size: 0.9rem; margin: 0.25rem 0 0; }
.card-danger-zone .card-title { color: #dc2626; }
.danger-zone-content { padding: var(--spacing-xl); }
.delete-account-form .form-group { margin-bottom: 1rem; }
.btn-danger { background: #dc2626; color: white; border: none; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-outline { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
.btn-outline:hover:not(:disabled) { background: var(--gray-50); }

/* Модалка */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: var(--spacing-lg);
}
.modal-card { background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); max-width: 420px; width: 100%; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-lg) var(--spacing-xl); border-bottom: 1px solid var(--gray-200); }
.modal-title { margin: 0; font-size: 1.25rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--gray-500); line-height: 1; }
.modal-close:hover { color: var(--gray-700); }
.modal-body { padding: var(--spacing-xl); }
.modal-hint { font-size: var(--font-size-sm); color: var(--gray-600); margin-bottom: var(--spacing-lg); }
.modal-body .form-group { margin-bottom: 1rem; }
.modal-body .form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>