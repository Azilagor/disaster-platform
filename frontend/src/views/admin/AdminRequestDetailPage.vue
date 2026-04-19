<template>
  <div>
    <div class="back-row"><router-link to="/admin/requests" class="btn btn-secondary">{{ $t('common.backToList') }}</router-link></div>
    <div v-if="loading" class="card">{{ $t('common.loadingEllipsis') }}</div>
    <template v-else-if="request">
      <div class="card">
        <h1 class="page-title">{{ $t('admin.requestTitle', { id: request.id }) }}</h1>
        <dl class="detail-list">
          <div><dt>{{ $t('common.title') }}</dt><dd>{{ request.title }}</dd></div>
          <div><dt>{{ $t('common.description') }}</dt><dd>{{ request.description || '—' }}</dd></div>
          <div><dt>{{ $t('common.status') }}</dt><dd><span class="badge">{{ request.status }}</span></dd></div>
          <div><dt>{{ $t('common.priority') }}</dt><dd>{{ request.priority }}</dd></div>
          <div><dt>{{ $t('admin.publishedLabel') }}</dt><dd>{{ request.isPublished ? $t('common.yes') : $t('common.no') }}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.actions') }}</h2>
        <div class="inline-row">
          <select v-model="statusSelect" class="form-control" style="max-width: 160px;">
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="setStatus">{{ $t('admin.changeStatus') }}</button>
          <template v-if="request.status !== 'DONE' && request.status !== 'CANCELLED'">
            <button v-if="!request.isPublished" type="button" class="btn btn-primary" :disabled="actionLoading" @click="publish">{{ $t('coordinatorRequests.publish') }}</button>
            <button v-else type="button" class="btn btn-secondary" :disabled="actionLoading" @click="unpublish">{{ $t('admin.unpublish') }}</button>
          </template>
          <button type="button" class="btn btn-danger" :disabled="actionLoading" @click="doDelete">{{ $t('admin.deleteRequest') }}</button>
          <span v-if="actionMessage" class="msg" :class="{ error: actionError }">{{ actionMessage }}</span>
        </div>
      </div>
    </template>
    <div v-else class="card">{{ $t('admin.requestNotFound') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getRequest, patchRequestStatus, publishRequest, unpublishRequest, deleteRequest } from '../../api/requests.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const request = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const actionMessage = ref('')
const actionError = ref(false)
const statusSelect = ref('NEW')

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    request.value = await getRequest(id)
    statusSelect.value = request.value.status
  } catch (e) {
    request.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)

async function setStatus() {
  actionMessage.value = ''
  actionError.value = false
  actionLoading.value = true
  try {
    const data = await patchRequestStatus(request.value.id, statusSelect.value)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || t('admin.statusChanged')
  } catch (e) {
    actionMessage.value = e.message || t('common.error')
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function publish() {
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const data = await publishRequest(request.value.id)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || t('admin.publishedMsg')
  } catch (e) {
    actionMessage.value = e.message || t('common.error')
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function unpublish() {
  actionMessage.value = ''
  actionLoading.value = true
  try {
    const data = await unpublishRequest(request.value.id)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || t('admin.unpublishedMsg')
  } catch (e) {
    actionMessage.value = e.message || t('common.error')
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function doDelete() {
  if (!confirm(t('admin.deleteRequestConfirm'))) return
  actionLoading.value = true
  try {
    await deleteRequest(request.value.id)
    router.push('/admin/requests')
  } catch (e) {
    actionMessage.value = e.message || t('common.error')
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}
</script>

<style scoped>
.back-row { margin-bottom: var(--spacing-lg); }
.detail-list { display: grid; gap: var(--spacing-sm); }
.detail-list dt { font-size: var(--font-size-sm); color: var(--gray-500); }
.section-title { font-size: var(--font-size-lg); margin-bottom: var(--spacing-md); }
.inline-row { display: flex; gap: var(--spacing-md); align-items: center; flex-wrap: wrap; }
.msg { margin-left: var(--spacing-md); }
.msg.error { color: var(--danger); }
.badge { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
</style>
