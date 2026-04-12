<template>
  <div>
    <div class="back-row">
      <router-link to="/admin/users" class="btn btn-secondary">← К списку</router-link>
    </div>

    <div v-if="loading" class="card"><p>Загрузка…</p></div>

    <template v-else-if="user">

      <!-- Шапка -->
      <div class="card user-header-card">
        <div class="user-header">
          <div class="user-avatar-circle">
            {{ (user.firstName?.[0] ?? '') }}{{ (user.lastName?.[0] ?? '') }}
          </div>
          <div class="user-header-info">
            <h1 class="page-title">{{ [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' }}</h1>
            <div class="user-meta-row">
              <span class="role-badge" :class="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ user.email }}</span>
              <span v-if="user.phone" class="meta-sep">·</span>
              <span v-if="user.phone" class="meta-text">{{ user.phone }}</span>
            </div>
            <div class="user-meta-row" style="margin-top: 0.25rem;">
              <span class="meta-text">ID: {{ user.id }}</span>
              <span v-if="user.district" class="meta-sep">·</span>
              <span v-if="user.district" class="meta-text">{{ user.district }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text" :class="user.isEmailVerified ? 'text-green' : 'text-red'">
                {{ user.isEmailVerified ? '✓ Email подтверждён' : '✗ Email не подтверждён' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Редактирование основных данных -->
      <div class="card">
        <h2 class="section-title">Редактирование данных</h2>
        <form @submit.prevent="saveUser">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Имя</label>
              <input v-model="form.firstName" class="form-control" />
            </div>
            <div class="form-group">
              <label>Фамилия</label>
              <input v-model="form.lastName" class="form-control" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="form.email" type="email" class="form-control" />
            </div>
            <div class="form-group">
              <label>Роль</label>
              <select v-model="form.role" class="form-control">
                <option value="USER">USER — Пользователь</option>
                <option value="VOLUNTEER">VOLUNTEER — Волонтёр</option>
                <option value="COORDINATOR">COORDINATOR — Координатор</option>
                <option value="ADMIN">ADMIN — Администратор</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
            <span v-if="saveMessage" class="form-msg" :class="{ 'form-msg--error': saveError }">
              {{ saveMessage }}
            </span>
          </div>
        </form>
      </div>

      <!-- Смена пароля -->
      <div class="card">
        <h2 class="section-title">Смена пароля</h2>
        <p class="section-hint">Установить новый пароль для этого пользователя. Минимум 8 символов.</p>
        <form @submit.prevent="doResetPassword">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Новый пароль</label>
              <div class="password-input-wrap">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  placeholder="Минимум 8 символов"
                  minlength="8"
                  required
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Подтверждение</label>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="Повторите пароль"
              />
            </div>
          </div>
          <div v-if="passwordMismatch" class="form-msg form-msg--error">Пароли не совпадают</div>
          <div class="form-actions">
            <button type="submit" class="btn btn-secondary" :disabled="passwordSaving || passwordMismatch || !newPassword">
              {{ passwordSaving ? 'Сохранение...' : '🔑 Установить пароль' }}
            </button>
            <span v-if="passwordMessage" class="form-msg" :class="{ 'form-msg--error': passwordError }">
              {{ passwordMessage }}
            </span>
          </div>
        </form>
      </div>

      <!-- Удаление пользователя с каскадным предупреждением -->
      <div v-if="user.role !== 'ADMIN'" class="card card-danger">
        <h2 class="section-title section-title--danger">⚠️ Удаление пользователя</h2>

        <div v-if="!showDeleteConfirm">
          <p class="danger-text">
            Удаление необратимо. Будут каскадно удалены все связанные данные:
          </p>
          <ul class="cascade-list">
            <li>👤 Аккаунт пользователя</li>
            <li>📋 Все созданные заявки ({{ user._count?.createdRequests ?? '...' }} шт.)</li>
            <li>🙋 Все назначения как волонтёра ({{ user._count?.volunteerRequests ?? '...' }} шт.)</li>
            <li>📧 Токены верификации и сброса пароля</li>
          </ul>
          <button type="button" class="btn btn-danger" @click="showDeleteConfirm = true">
            Удалить пользователя
          </button>
        </div>

        <!-- Подтверждение удаления -->
        <div v-else class="delete-confirm-block">
          <p class="danger-text danger-text--bold">
            Вы точно хотите удалить <strong>{{ user.firstName }} {{ user.lastName }}</strong> ({{ user.email }})?
          </p>
          <p class="danger-text">Это действие невозможно отменить.</p>
          <div class="form-group">
            <label>Введите email пользователя для подтверждения:</label>
            <input
              v-model="deleteConfirmEmail"
              type="email"
              class="form-control"
              :placeholder="user.email"
            />
          </div>
          <div v-if="deleteMessage" class="form-msg form-msg--error">{{ deleteMessage }}</div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false; deleteConfirmEmail = ''">
              Отмена
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="deleteConfirmEmail !== user.email || deleting"
              @click="doDelete"
            >
              {{ deleting ? 'Удаление...' : '🗑 Подтвердить удаление' }}
            </button>
          </div>
        </div>
      </div>

    </template>

    <div v-else class="card"><p>Пользователь не найден</p></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser, updateUser, setUserRole, deleteUser } from '../../api/users.js'
import { fetchWithAuth, parseJsonResponse } from '../../api/client.js'

const route  = useRoute()
const router = useRouter()

const user    = ref(null)
const loading = ref(true)

// ── Форма редактирования ──────────────────────────────────────
const form = reactive({ firstName: '', lastName: '', email: '', role: 'USER' })
const saving      = ref(false)
const saveMessage = ref('')
const saveError   = ref(false)

function fillForm() {
  if (!user.value) return
  form.firstName = user.value.firstName ?? ''
  form.lastName  = user.value.lastName  ?? ''
  form.email     = user.value.email     ?? ''
  form.role      = user.value.role      ?? 'USER'
}

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    user.value = await getUser(id)
    fillForm()
  } catch {
    user.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)

async function saveUser() {
  saveMessage.value = ''
  saveError.value   = false
  saving.value      = true
  try {
    const data = await updateUser(user.value.id, {
      firstName: form.firstName?.trim(),
      lastName:  form.lastName?.trim(),
      email:     form.email?.trim(),
      role:      form.role,
    })
    if (data.user) { user.value = data.user; fillForm() }
    saveMessage.value = data.message || '✓ Сохранено'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (e) {
    saveMessage.value = e.message || 'Ошибка'
    saveError.value   = true
  } finally {
    saving.value = false
  }
}

// ── Смена пароля ──────────────────────────────────────────────
const newPassword     = ref('')
const confirmPassword = ref('')
const showPassword    = ref(false)
const passwordSaving  = ref(false)
const passwordMessage = ref('')
const passwordError   = ref(false)

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)

async function doResetPassword() {
  if (passwordMismatch.value || !newPassword.value) return
  passwordMessage.value = ''
  passwordError.value   = false
  passwordSaving.value  = true
  try {
    const res = await fetchWithAuth(`/admin/users/${user.value.id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword: newPassword.value }),
    })
    const data = await parseJsonResponse(res)
    passwordMessage.value = data.message || '✓ Пароль изменён'
    newPassword.value     = ''
    confirmPassword.value = ''
    setTimeout(() => { passwordMessage.value = '' }, 3000)
  } catch (e) {
    passwordMessage.value = e.message || 'Ошибка'
    passwordError.value   = true
  } finally {
    passwordSaving.value = false
  }
}

// ── Удаление ──────────────────────────────────────────────────
const showDeleteConfirm  = ref(false)
const deleteConfirmEmail = ref('')
const deleting           = ref(false)
const deleteMessage      = ref('')

async function doDelete() {
  if (deleteConfirmEmail.value !== user.value.email) return
  deleteMessage.value = ''
  deleting.value      = true
  try {
    await deleteUser(user.value.id)
    router.push('/admin/users')
  } catch (e) {
    deleteMessage.value = e.message || 'Ошибка удаления'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.back-row { margin-bottom: 1.25rem; }
.page-title { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.25rem; }
.section-title { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.75rem; }
.section-title--danger { color: #dc2626; }
.section-hint { font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem; }

/* Шапка пользователя */
.user-header-card { padding: 1.25rem; }
.user-header { display: flex; align-items: center; gap: 1rem; }
.user-avatar-circle {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-size: 1.25rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; text-transform: uppercase;
}
.user-header-info { display: flex; flex-direction: column; }
.user-meta-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; flex-wrap: wrap; }
.meta-sep { color: #d1d5db; }
.meta-text { color: #6b7280; }
.text-green { color: #059669 !important; }
.text-red   { color: #dc2626 !important; }

/* Роль бэдж */
.role-badge {
  display: inline-block; padding: 0.15rem 0.6rem;
  border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
}
.role-admin       { background: #fef3c7; color: #92400e; }
.role-coordinator { background: #ede9fe; color: #5b21b6; }
.role-volunteer   { background: #dcfce7; color: #166534; }
.role-user        { background: #f3f4f6; color: #374151; }

/* Формы */
.form-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
@media (max-width: 600px) { .form-grid-2 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
.form-msg { font-size: 0.85rem; color: #059669; }
.form-msg--error { color: #dc2626; }

/* Поле пароля */
.password-input-wrap { position: relative; }
.password-input-wrap .form-control { padding-right: 2.5rem; }
.toggle-password {
  position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1;
}

/* Опасная зона */
.card-danger { border: 1px solid #fecaca; background: #fff8f8; }
.danger-text { font-size: 0.9rem; color: #374151; margin-bottom: 0.75rem; }
.danger-text--bold strong { color: #dc2626; }
.cascade-list {
  margin: 0 0 1rem 1.25rem; padding: 0;
  display: flex; flex-direction: column; gap: 0.25rem;
}
.cascade-list li { font-size: 0.85rem; color: #6b7280; }
.delete-confirm-block { border-top: 1px solid #fecaca; padding-top: 1rem; margin-top: 0.5rem; }

.btn-danger { background: #dc2626; color: #fff; border: none; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>