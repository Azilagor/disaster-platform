<template>
  <div>
    <div class="back-row">
      <router-link to="/admin/users" class="btn btn-secondary">{{ t('common.backToList') }}</router-link>
    </div>

    <div v-if="loading" class="card"><p>{{ t('admin.loading') }}</p></div>

    <template v-else-if="user">
      <div class="card user-header-card">
        <div class="user-header">
          <div class="user-avatar-circle">
            {{ (user.firstName?.[0] ?? '') }}{{ (user.lastName?.[0] ?? '') }}
          </div>
          <div class="user-header-info">
            <h1 class="page-title">{{ [user.firstName, user.lastName].filter(Boolean).join(' ') || t('common.emDash') }}</h1>
            <div class="user-meta-row">
              <span class="role-badge" :class="'role-' + user.role.toLowerCase()">{{ roleLabel(user.role) }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ user.email }}</span>
              <span v-if="user.phone" class="meta-sep">·</span>
              <span v-if="user.phone" class="meta-text">{{ user.phone }}</span>
            </div>
            <div class="user-meta-row" style="margin-top: 0.25rem;">
              <span class="meta-text">{{ t('admin.userDetail.idLabel') }}: {{ user.id }}</span>
              <span v-if="user.district" class="meta-sep">·</span>
              <span v-if="user.district" class="meta-text">{{ districtLabel(user.district) }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text" :class="user.isEmailVerified ? 'text-green' : 'text-red'">
                {{ user.isEmailVerified ? t('admin.userDetail.emailVerified') : t('admin.userDetail.emailNotVerified') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">{{ t('admin.userDetail.editData') }}</h2>
        <form @submit.prevent="saveUser">
          <div class="form-grid-2">
            <div class="form-group">
              <label>{{ t('profile.firstName') }}</label>
              <input v-model="form.firstName" class="form-control" />
            </div>
            <div class="form-group">
              <label>{{ t('profile.lastName') }}</label>
              <input v-model="form.lastName" class="form-control" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.userDetail.email') }}</label>
              <input v-model="form.email" type="email" class="form-control" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.thRole') }}</label>
              <select v-model="form.role" class="form-control">
                <option v-for="r in ROLE_CODES" :key="r" :value="r">{{ r }} — {{ roleLabel(r) }}</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? t('admin.userDetail.saving') : t('admin.userDetail.saveChanges') }}
            </button>
            <span v-if="saveMessage" class="form-msg" :class="{ 'form-msg--error': saveError }">
              {{ saveMessage }}
            </span>
          </div>
        </form>
      </div>

      <div class="card">
        <h2 class="section-title">{{ t('admin.userDetail.passwordTitle') }}</h2>
        <p class="section-hint">{{ t('admin.userDetail.passwordHint') }}</p>
        <form @submit.prevent="doResetPassword">
          <div class="form-grid-2">
            <div class="form-group">
              <label>{{ t('admin.userDetail.newPassword') }}</label>
              <div class="password-input-wrap">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  :placeholder="t('admin.userDetail.passwordPlaceholder')"
                  minlength="8"
                  required
                />
                <button type="button" class="toggle-password" :aria-label="t('admin.userDetail.togglePassword')" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>{{ t('admin.userDetail.confirmPassword') }}</label>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                :placeholder="t('admin.userDetail.repeatPasswordPlaceholder')"
              />
            </div>
          </div>
          <div v-if="passwordMismatch" class="form-msg form-msg--error">{{ t('admin.userDetail.passwordMismatch') }}</div>
          <div class="form-actions">
            <button type="submit" class="btn btn-secondary" :disabled="passwordSaving || passwordMismatch || !newPassword">
              {{ passwordSaving ? t('admin.userDetail.saving') : t('admin.userDetail.setPassword') }}
            </button>
            <span v-if="passwordMessage" class="form-msg" :class="{ 'form-msg--error': passwordError }">
              {{ passwordMessage }}
            </span>
          </div>
        </form>
      </div>

      <div v-if="user.role !== 'ADMIN'" class="card card-danger">
        <h2 class="section-title section-title--danger">{{ t('admin.userDetail.deleteTitle') }}</h2>

        <div v-if="!showDeleteConfirm">
          <p class="danger-text">{{ t('admin.userDetail.deleteIntro') }}</p>
          <ul class="cascade-list">
            <li>{{ t('admin.userDetail.deleteCascadeUser') }}</li>
            <li>{{ t('admin.userDetail.deleteCascadeRequests', { count: user._count?.createdRequests ?? '…' }) }}</li>
            <li>{{ t('admin.userDetail.deleteCascadeVolunteer', { count: user._count?.volunteerRequests ?? '…' }) }}</li>
            <li>{{ t('admin.userDetail.deleteCascadeTokens') }}</li>
          </ul>
          <button type="button" class="btn btn-danger" @click="showDeleteConfirm = true">
            {{ t('admin.userDetail.deleteBtn') }}
          </button>
        </div>

        <div v-else class="delete-confirm-block">
          <p class="danger-text danger-text--bold">
            {{ t('admin.userDetail.deleteConfirmPrompt', { name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email, email: user.email }) }}
          </p>
          <p class="danger-text">{{ t('admin.userDetail.deleteConfirmIrreversible') }}</p>
          <div class="form-group">
            <label>{{ t('admin.userDetail.deleteTypeEmail') }}</label>
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
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="deleteConfirmEmail !== user.email || deleting"
              @click="doDelete"
            >
              {{ deleting ? t('admin.userDetail.deleting') : t('admin.userDetail.deleteConfirmBtn') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="card"><p>{{ t('admin.userDetail.notFound') }}</p></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getUser, updateUser, deleteUser, resetUserPasswordAsAdmin } from '../../api/users.js'
import { useEnumLabel } from '../../composables/useEnumLabel.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const enumLb = useEnumLabel()

const ROLE_CODES = ['USER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN']

function roleLabel(code) {
  const key = `roles.${String(code || '').toLowerCase()}`
  return t(key)
}

function districtLabel(code) {
  if (!code) return ''
  return enumLb.district(code)
}

const user = ref(null)
const loading = ref(true)

const form = reactive({ firstName: '', lastName: '', email: '', role: 'USER' })
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)

function fillForm() {
  if (!user.value) return
  form.firstName = user.value.firstName ?? ''
  form.lastName = user.value.lastName ?? ''
  form.email = user.value.email ?? ''
  form.role = user.value.role ?? 'USER'
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
  saveError.value = false
  saving.value = true
  try {
    const data = await updateUser(user.value.id, {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      email: form.email?.trim(),
      role: form.role,
    })
    if (data.user) {
      user.value = data.user
      fillForm()
    }
    saveMessage.value = data.message || t('admin.userDetail.saved')
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (e) {
    saveMessage.value = e.message || t('admin.genericError')
    saveError.value = true
  } finally {
    saving.value = false
  }
}

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const passwordSaving = ref(false)
const passwordMessage = ref('')
const passwordError = ref(false)

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)

async function doResetPassword() {
  if (passwordMismatch.value || !newPassword.value) return
  passwordMessage.value = ''
  passwordError.value = false
  passwordSaving.value = true
  try {
    const data = await resetUserPasswordAsAdmin(user.value.id, newPassword.value)
    passwordMessage.value = data.message || t('admin.userDetail.passwordChanged')
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { passwordMessage.value = '' }, 3000)
  } catch (e) {
    passwordMessage.value = e.message || t('admin.genericError')
    passwordError.value = true
  } finally {
    passwordSaving.value = false
  }
}

const showDeleteConfirm = ref(false)
const deleteConfirmEmail = ref('')
const deleting = ref(false)
const deleteMessage = ref('')

async function doDelete() {
  if (deleteConfirmEmail.value !== user.value.email) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await deleteUser(user.value.id)
    router.push('/admin/users')
  } catch (e) {
    deleteMessage.value = e.message || t('admin.genericError')
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

.role-badge {
  display: inline-block; padding: 0.15rem 0.6rem;
  border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
}
.role-admin       { background: #fef3c7; color: #92400e; }
.role-coordinator { background: #ede9fe; color: #5b21b6; }
.role-volunteer   { background: #dcfce7; color: #166534; }
.role-user        { background: #f3f4f6; color: #374151; }

.form-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
@media (max-width: 600px) { .form-grid-2 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
.form-msg { font-size: 0.85rem; color: #059669; }
.form-msg--error { color: #dc2626; }

.password-input-wrap { position: relative; }
.password-input-wrap .form-control { padding-right: 2.5rem; }
.toggle-password {
  position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1;
}

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
