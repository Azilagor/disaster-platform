<template>
  <div>
    <div class="back-row"><router-link to="/admin/incidents" class="btn btn-secondary">{{ $t('common.backToList') }}</router-link></div>
    <div v-if="loading" class="card">{{ $t('common.loadingEllipsis') }}</div>
    <template v-else-if="incident">
      <div class="card">
        <h1 class="page-title">{{ $t('admin.incidentTitle', { id: incident.id }) }}</h1>
        <dl class="detail-list">
          <div><dt>{{ $t('common.title') }}</dt><dd>{{ incident.title }}</dd></div>
          <div><dt>{{ $t('common.description') }}</dt><dd>{{ incident.description || '—' }}</dd></div>
          <div><dt>{{ $t('common.status') }}</dt><dd><span class="badge">{{ incident.status }}</span></dd></div>
          <div><dt>{{ $t('admin.level') }}</dt><dd>{{ incident.severity }}</dd></div>
          <div><dt>{{ $t('common.district') }}</dt><dd>{{ incident.district }}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.editing') }}</h2>
        <form @submit.prevent="save">
          <div class="form-group">
            <label>{{ $t('common.title') }}</label>
            <input v-model="form.title" class="form-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('common.description') }}</label>
            <textarea v-model="form.description" class="form-control" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.level') }}</label>
            <select v-model="form.severity" class="form-control">
              <option v-for="s in ALLOWED_SEVERITIES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('common.district') }}</label>
            <select v-model="form.district" class="form-control">
              <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ $t('common.save') }}</button>
          <span v-if="saveMessage" class="msg" :class="{ error: saveError }">{{ saveMessage }}</span>
        </form>
      </div>
      <div v-if="incident.status !== 'RESOLVED'" class="card">
        <h2 class="section-title">{{ $t('admin.statusChange') }}</h2>
        <div class="inline-row">
          <select v-model="statusSelect" class="form-control" style="max-width: 160px;">
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESOLVING">RESOLVING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
          <button type="button" class="btn btn-secondary" :disabled="statusSaving" @click="changeStatus">{{ $t('admin.changeStatus') }}</button>
          <span v-if="statusMessage" class="msg" :class="{ error: statusError }">{{ statusMessage }}</span>
        </div>
      </div>
      <div class="card">
        <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDelete">{{ $t('admin.deleteIncident') }}</button>
        <span v-if="deleteMessage" class="msg error">{{ deleteMessage }}</span>
      </div>
    </template>
    <div v-else class="card">{{ $t('admin.incidentNotFound') }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getIncident, updateIncident, patchIncidentStatus, deleteIncident } from '../../api/incidents.js'
import { ALLOWED_SEVERITIES } from '../../constants/incidents.js'
import { ALLOWED_DISTRICTS } from '../../constants/requests.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const incident = ref(null)
const loading = ref(true)
const saving = ref(false)
const statusSaving = ref(false)
const deleting = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const statusMessage = ref('')
const statusError = ref(false)
const deleteMessage = ref('')
const statusSelect = ref('ACTIVE')
const form = reactive({ title: '', description: '', severity: '', district: '' })

function fillForm() {
  if (!incident.value) return
  form.title = incident.value.title ?? ''
  form.description = incident.value.description ?? ''
  form.severity = incident.value.severity ?? 'MEDIUM'
  form.district = incident.value.district ?? ''
  statusSelect.value = incident.value.status ?? 'ACTIVE'
}

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    incident.value = await getIncident(id)
    fillForm()
  } catch (e) {
    incident.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)

async function save() {
  saveMessage.value = ''
  saveError.value = false
  saving.value = true
  try {
    const data = await updateIncident(incident.value.id, {
      title: form.title?.trim(),
      description: form.description?.trim(),
      severity: form.severity,
      district: form.district,
    })
    if (data.incident) incident.value = data.incident
    saveMessage.value = data.message || t('common.success')
  } catch (e) {
    saveMessage.value = e.message || t('common.error')
    saveError.value = true
  } finally {
    saving.value = false
  }
}

async function changeStatus() {
  statusMessage.value = ''
  statusError.value = false
  statusSaving.value = true
  try {
    const data = await patchIncidentStatus(incident.value.id, statusSelect.value)
    if (data.incident) incident.value = data.incident
    statusMessage.value = data.message || t('admin.statusChanged')
  } catch (e) {
    statusMessage.value = e.message || t('common.error')
    statusError.value = true
  } finally {
    statusSaving.value = false
  }
}

async function confirmDelete() {
  if (!confirm(t('admin.deleteIncidentConfirm'))) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await deleteIncident(incident.value.id)
    router.push('/admin/incidents')
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
