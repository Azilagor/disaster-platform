<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info-section">
        <div class="profile-avatar-block">
          <div
            class="profile-avatar-wrapper profile-avatar-clickable"
            :class="{ 'avatar-uploading': avatarUploading }"
            role="button"
            tabindex="0"
            :title="t('profilePage.changePhoto')"
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
              <img
                :src="avatarSrc"
                alt=""
                class="profile-avatar"
                width="120"
                height="120"
                @error="avatarLoadError = true"
              />
            </template>
            <template v-else>
              <div class="profile-avatar-placeholder">
                <svg class="avatar-placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <span class="avatar-placeholder-text">{{ t('profilePage.photo') }}</span>
              </div>
            </template>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="avatar-input-hidden"
              :aria-label="t('profilePage.selectPhotoAria')"
              @change="onAvatarFileChange"
            />
          </div>
          <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
          <p class="avatar-hint">{{ t('profile.avatarHint') }}</p>
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
              {{ authStore.user?.email ?? t('common.emDash') }}
            </span>
            <span class="meta-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M18 15v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
                <path d="M10 2v12M4 8l6 6 6-6" />
              </svg>
              {{ authStore.user?.phone || t('common.emDash') }}
            </span>
          </div>
          <div class="profile-actions">
            <button type="button" class="btn btn-primary btn-sm" @click="openEditProfileModal">{{ t('profilePage.editProfile') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-left-column">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.personalData') }}</h2>
          </div>
          <form class="profile-form" @submit.prevent="saveProfile">
            <div class="form-grid">
              <div class="form-group">
                <label for="profile-firstName">{{ t('profile.firstName') }}</label>
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
                <label for="profile-lastName">{{ t('profile.lastName') }}</label>
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
                <label for="profile-phone">{{ t('profile.phone') }}</label>
                <input
                  id="profile-phone"
                  v-model="profileForm.phone"
                  type="tel"
                  class="form-control"
                  :placeholder="t('profile.phonePlaceholder')"
                />
              </div>
              <div class="form-group">
                <label for="profile-district">{{ t('volunteers.thDistrict') }}</label>
                <select id="profile-district" v-model="profileForm.district" class="form-control">
                  <option value="">{{ t('profilePage.districtUnset') }}</option>
                  <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ enumLabel.district(d) }}</option>
                </select>
              </div>
              <div class="form-group form-group-full">
                <label for="profile-telegram">{{ t('profilePage.telegram') }}</label>
                <input
                  id="profile-telegram"
                  v-model="profileForm.telegramUsername"
                  type="text"
                  class="form-control"
                  :placeholder="t('profilePage.telegramPlaceholder')"
                />
                <span v-if="profileError" class="form-error">{{ profileError }}</span>
                <span v-if="profileSuccess" class="form-success">{{ profileSuccess }}</span>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="profileSaving">{{ t('profilePage.save') }}</button>
            </div>
          </form>
          <div class="info-list profile-readonly-meta" style="padding: 0 var(--spacing-xl) var(--spacing-xl)">
            <div class="info-item">
              <span class="info-label">{{ t('profilePage.emailLabel') }}</span>
              <span class="info-value">{{ authStore.user?.email ?? t('common.emDash') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('profilePage.roleLabel') }}</span>
              <span class="info-value">{{ authStore.userRole }}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.statsTitle') }}</h2>
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
                <div class="stat-label">{{ t('profilePage.createdRequests') }}</div>
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
                <div class="stat-label">{{ t('profilePage.completedAsVolunteer') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.myRequestsTitle') }}</h2>
          </div>
          <div v-if="myRequestsLoading" class="profile-requests-loading">{{ t('common.loadingEllipsis') }}</div>
          <div v-else-if="myRequestsError" class="profile-requests-error">{{ myRequestsError }}</div>
          <div v-else-if="myRequests.length === 0" class="profile-requests-empty">
            {{ t('profilePage.myRequestsEmpty') }} <router-link to="/create-request">{{ t('profilePage.createRequestLink') }}</router-link>
          </div>
          <ul v-else class="profile-requests-list">
            <li v-for="req in myRequests" :key="req.id" class="profile-request-item">
              <router-link :to="'/map?request=' + req.id" class="profile-request-link">
                <span class="profile-request-title">{{ req.title }}</span>
                <span class="profile-request-meta">
                  {{ enumLabel.problemType(req.problemType) ?? req.problemType }} ·
                  {{ enumLabel.priority(req.priority) ?? req.priority }} ·
                  {{ enumLabel.requestStatus(req.status) ?? req.status }}
                </span>
                <span class="profile-request-address">{{ req.address }}</span>
              </router-link>
            </li>
          </ul>
        </div>
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.skillsTitle') }}</h2>
          </div>
          <div style="padding: var(--spacing-xl)">
            <div class="skills-grid">
              <span v-for="(s, idx) in skills" :key="idx" class="skill-badge-large">{{ s }}</span>
            </div>
          </div>
        </div>
        <div class="card card-danger-zone">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.deleteAccountTitle') }}</h2>
          </div>
          <div class="danger-zone-content">
            <p>{{ t('profilePage.deleteAccountWarning') }}</p>
            <div v-if="deleteAccountError" class="auth-message auth-message-error">{{ deleteAccountError }}</div>
            <form class="delete-account-form" @submit.prevent="submitDeleteAccount">
              <div class="form-group">
                <label for="delete-password">{{ t('profilePage.deletePasswordLabel') }}</label>
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
                <span>{{ t('profilePage.deleteUnderstand') }}</span>
              </label>
              <button
                type="submit"
                class="btn btn-danger"
                :disabled="!deleteConfirm || !deletePassword.trim() || deleteAccountSaving"
              >
                {{ deleteAccountSaving ? t('profilePage.deleteSubmitting') : t('profilePage.deleteSubmit') }}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div class="profile-right-column">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ t('profilePage.activityTitle') }}</h2>
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
            <h2 class="card-title">{{ t('profilePage.achievementsTitle') }}</h2>
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

    <!-- Edit profile modal (email) -->
    <div v-if="editProfileModalOpen" class="modal-overlay" @click.self="editProfileModalOpen = false">
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('profilePage.modalEditTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="t('common.close')" @click="editProfileModalOpen = false">&times;</button>
        </div>
        <form class="modal-body" @submit.prevent="saveEditProfile">
          <p class="modal-hint">{{ t('profilePage.modalEditHint') }}</p>
          <div class="form-group">
            <label for="edit-profile-email">{{ t('profilePage.emailLabel') }}</label>
            <input
              id="edit-profile-email"
              v-model="editProfileEmail"
              type="email"
              class="form-control"
              required
              :placeholder="t('profilePage.emailPlaceholder')"
            />
            <span v-if="editProfileError" class="form-error">{{ editProfileError }}</span>
            <span v-if="editProfileSuccess" class="form-success">{{ editProfileSuccess }}</span>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="editProfileModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="editProfileSaving">{{ t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'
import { getMyRequests } from '../api/requests.js'
import { updateProfile, uploadAvatar, deleteAccount } from '../api/auth.js'
import { ALLOWED_DISTRICTS } from '../constants/requests.js'
import { useEnumLabel } from '../composables/useEnumLabel.js'

const { t } = useI18n()
const enumLabel = useEnumLabel()
const router = useRouter()
const authStore = useAuthStore()
const avatarInputRef = ref(null)
const avatarUploading = ref(false)
const avatarLoadError = ref(false)
const avatarSrc = computed(() => authStore.userAvatar)
watch(avatarSrc, () => { avatarLoadError.value = false })

function triggerAvatarInput() {
  if (avatarInputRef.value) avatarInputRef.value.click()
}

const avatarError = ref('')

async function onAvatarFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarError.value = ''
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    avatarError.value = t('profilePage.avatarTypeError')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = t('profilePage.avatarSizeError')
    return
  }
  e.target.value = ''
  avatarUploading.value = true
  try {
    const { avatarUrl } = await uploadAvatar(file)
    authStore.setAuth(authStore.token, { ...authStore.user, avatarUrl })
    avatarLoadError.value = false
  } catch (err) {
    avatarError.value = err.message || t('profilePage.avatarUploadError')
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
  if (!email) {
    editProfileError.value = t('profilePage.emailRequired')
    return
  }
  editProfileError.value = ''
  editProfileSuccess.value = ''
  editProfileSaving.value = true
  try {
    const { user: updated } = await updateProfile({ email })
    authStore.setAuth(authStore.token, updated)
    editProfileSuccess.value = t('profilePage.emailSaved')
    setTimeout(() => {
      editProfileModalOpen.value = false
      editProfileSuccess.value = ''
    }, 2500)
  } catch (e) {
    editProfileError.value = e.message || t('profilePage.emailSaveError')
  } finally {
    editProfileSaving.value = false
  }
}

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
    deleteAccountError.value = err.message || t('profilePage.deleteAccountError')
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
    profileSuccess.value = t('profile.saveSuccess')
    setTimeout(() => { profileSuccess.value = '' }, 3000)
  } catch (e) {
    profileError.value = e.message || t('profilePage.profileSaveError')
  } finally {
    profileSaving.value = false
  }
}

watch(() => authStore.user, syncProfileForm, { deep: true })

const myRequests = ref([])
const myRequestsLoading = ref(true)
const myRequestsError = ref('')

onMounted(async () => {
  syncProfileForm()
  try {
    myRequests.value = await getMyRequests()
  } catch (e) {
    myRequestsError.value = e.message || t('profilePage.myRequestsLoadError')
  } finally {
    myRequestsLoading.value = false
  }
})

const skills = computed(() => [t('profilePage.skill1'), t('profilePage.skill2')])
const timeline = computed(() => [
  { id: 1, type: 'success', text: t('profilePage.timeline1'), time: t('profilePage.time2h') },
  { id: 2, type: 'info', text: t('profilePage.timeline2'), time: t('profilePage.timeYesterday') },
  { id: 3, type: 'warning', text: t('profilePage.timeline3'), time: t('profilePage.timeYesterday10') },
])
const achievements = computed(() => [
  { id: 1, title: t('profilePage.ach1t'), description: t('profilePage.ach1d'), unlocked: true },
  { id: 2, title: t('profilePage.ach2t'), description: t('profilePage.ach2d'), unlocked: true },
  { id: 3, title: t('profilePage.ach3t'), description: t('profilePage.ach3d'), unlocked: false },
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
.profile-avatar-clickable {
  cursor: pointer;
}
.profile-avatar-clickable:hover {
  opacity: 0.95;
}
.profile-avatar-clickable.avatar-uploading {
  pointer-events: none;
  opacity: 0.8;
}
.profile-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}
.profile-avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--gray-200);
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}
.avatar-placeholder-icon {
  color: var(--gray-400);
}
.avatar-placeholder-text {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}
.profile-avatar-placeholder-loading .avatar-placeholder-text {
  animation: avatar-pulse 0.8s ease-in-out infinite;
}
@keyframes avatar-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.avatar-error { color: var(--red-600, #dc2626); font-size: var(--font-size-sm); margin: 0.25rem 0 0; }
.avatar-hint { font-size: var(--font-size-xs); color: var(--gray-500); margin: 0.25rem 0 0; }
.btn-outline {
  background: transparent;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}
.btn-outline:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--gray-400);
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

/* Edit profile modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}
.modal-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 420px;
  width: 100%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
}
.modal-title { margin: 0; font-size: 1.25rem; }
.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-500);
  line-height: 1;
}
.modal-close:hover { color: var(--gray-700); }
.modal-body { padding: var(--spacing-xl); }
.modal-hint {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-lg);
}
.modal-body .form-group { margin-bottom: 1rem; }
.modal-body .form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>
