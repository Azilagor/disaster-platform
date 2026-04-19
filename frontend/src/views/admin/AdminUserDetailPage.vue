<template>
  <div>
    <div class="back-row"><router-link to="/admin/users" class="btn btn-secondary">{{ $t('common.backToList') }}</router-link></div>
    <div v-if="loading" class="card">{{ $t('common.loadingEllipsis') }}</div>
    <template v-else-if="user">
      <div class="card">
        <h1 class="page-title">{{ $t('admin.userTitle', { id: user.id }) }}</h1>
        <dl class="detail-list">
          <div><dt>{{ $t('volunteers.thName') }}</dt><dd>{{ [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' }}</dd></div>
          <div><dt>{{ $t('common.email') }}</dt><dd>{{ user.email }}</dd></div>
          <div><dt>{{ $t('common.phone') }}</dt><dd>{{ user.phone || '—' }}</dd></div>
          <div><dt>{{ $t('profile.role') }}</dt><dd><span class="badge">{{ user.role }}</span></dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.editing') }}</h2>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>{{ $t('auth.firstName') }}</label>
            <input v-model="form.firstName" class="form-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.lastName') }}</label>
            <input v-model="form.lastName" class="form-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('common.email') }}</label>
            <input v-model="form.email" type="email" class="form-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.role') }}</label>
            <select v-model="form.role" class="form-control">
              <option value="USER">USER</option>
              <option value="VOLUNTEER">VOLUNTEER</option>
              <option value="COORDINATOR">COORDINATOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ $t('common.save') }}</button>
          <span v-if="saveMessage" class="msg" :class="{ error: saveError }">{{ saveMessage }}</span>
        </form>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.changeRole') }}</h2>
        <div class="inline-row">
          <select v-model="roleSelect" class="form-control" style="max-width: 140px;">
            <option value="USER">USER</option>
            <option value="VOLUNTEER">VOLUNTEER</option>
            <option value="COORDINATOR">COORDINATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="button" class="btn btn-secondary" :disabled="roleSaving" @click="changeRole">{{ $t('admin.changeRoleBtn') }}</button>
          <span v-if="roleMessage" class="msg" :class="{ error: roleError }">{{ roleMessage }}</span>
        </div>
      </div>
      <div v-if="user.role !== 'ADMIN'" class="card">
        <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDelete">{{ $t('admin.deleteUser') }}</button>
        <span v-if="deleteMessage" class="msg error">{{ deleteMessage }}</span>
      </div>
    </template>
    <div v-else class="card">{{ $t('admin.userNotFound') }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getUser, updateUser, setUserRole, deleteUser } from '../../api/users.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const user = ref(null)
const loading = ref(true)
const saving = ref(false)
const roleSaving = ref(false)
const deleting = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const roleMessage = ref('')
const roleError = ref(false)
const deleteMessage = ref('')
const roleSelect = ref('USER')
const form = reactive({ firstName: '', lastName: '', email: '', role: 'USER' })

function fillForm() {
  if (!user.value) return
  form.firstName = user.value.firstName ?? ''
  form.lastName = user.value.lastName ?? ''
  form.email = user.value.email ?? ''
  form.role = user.value.role ?? 'USER'
  roleSelect.value = user.value.role ?? 'USER'
}

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    user.value = await getUser(id)
    fillForm()
  } catch (e) {
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
    if (data.user) user.value = data.user
    saveMessage.value = data.message || t('common.success')
  } catch (e) {
    saveMessage.value = e.message || t('common.error')
    saveError.value = true
  } finally {
    saving.value = false
  }
}

async function changeRole() {
  roleMessage.value = ''
  roleError.value = false
  roleSaving.value = true
  try {
    const data = await setUserRole(user.value.id, roleSelect.value)
    if (data.user) user.value = data.user
    roleMessage.value = data.message || t('admin.roleChanged')
  } catch (e) {
    roleMessage.value = e.message || t('common.error')
    roleError.value = true
  } finally {
    roleSaving.value = false
  }
}

async function confirmDelete() {
  if (!confirm(t('admin.deleteUserConfirm'))) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await deleteUser(user.value.id)
    router.push('/admin/users')
  } catch (e) {
    deleteMessage.value = e.message || t('common.error')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.back-row { margin-bottom: var(--spacing-lg); }
.detail-list { display: grid; gap: var(--spacing-sm); }
.detail-list dt { font-size: var(--font-size-sm); color: var(--gray-500); }
.section-title { font-size: var(--font-size-lg); margin-bottom: var(--spacing-md); }
.form-group { margin-bottom: var(--spacing-md); }
.form-group label { display: block; margin-bottom: var(--spacing-xs); font-weight: 600; font-size: var(--font-size-sm); }
.inline-row { display: flex; gap: var(--spacing-md); align-items: center; flex-wrap: wrap; }
.msg { margin-left: var(--spacing-md); }
.msg.error { color: var(--danger); }
.badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
</style>
