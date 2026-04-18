<template>
  <div>
    <div class="back-row"><router-link to="/admin/requests" class="btn btn-secondary">{{ t('common.backToList') }}</router-link></div>
    <div v-if="loading" class="card">{{ t('admin.loading') }}</div>
    <template v-else-if="request">
      <div class="card">
        <h1 class="page-title">{{ t('admin.requestDetail.title', { id: request.id }) }}</h1>
        <dl class="detail-list">
          <div><dt>{{ t('admin.requestDetail.headline') }}</dt><dd>{{ request.title }}</dd></div>
          <div><dt>{{ t('admin.requestDetail.description') }}</dt><dd>{{ request.description || t('common.emDash') }}</dd></div>
          <div><dt>{{ t('admin.thStatus') }}</dt><dd><span class="badge">{{ enumLabel.requestStatus(request.status) }}</span></dd></div>
          <div><dt>{{ t('admin.requestDetail.priority') }}</dt><dd>{{ enumLabel.priority(request.priority) }}</dd></div>
          <div><dt>{{ t('admin.requestDetail.published') }}</dt><dd>{{ request.isPublished ? t('common.yes') : t('common.no') }}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 class="section-title">{{ t('admin.requestDetail.actions') }}</h2>
        <div class="inline-row">
          <select v-model="statusSelect" class="form-control" style="max-width: 160px;">
            <option v-for="s in ALLOWED_STATUSES" :key="s" :value="s">{{ enumLabel.requestStatus(s) }}</option>
          </select>
          <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="setStatus">{{ t('admin.requestDetail.changeStatus') }}</button>
          <template v-if="request.status !== 'DONE' && request.status !== 'CANCELLED'">
            <button v-if="!request.isPublished" type="button" class="btn btn-primary" :disabled="actionLoading" @click="publish">{{ t('admin.requestDetail.publish') }}</button>
            <button v-else type="button" class="btn btn-secondary" :disabled="actionLoading" @click="unpublish">{{ t('admin.requestDetail.unpublish') }}</button>
          </template>
          <button type="button" class="btn btn-danger" :disabled="actionLoading" @click="doDelete">{{ t('admin.requestDetail.delete') }}</button>
          <span v-if="actionMessage" class="msg" :class="{ error: actionError }">{{ actionMessage }}</span>
        </div>
      </div>
    </template>
    <div v-else class="card">{{ t('admin.requestDetail.notFound') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getRequest, patchRequestStatus, publishRequest, unpublishRequest, deleteRequest } from '../../api/requests.js'
import { ALLOWED_STATUSES } from '../../constants/requests.js'
import { useEnumLabel } from '../../composables/useEnumLabel.js'

const { t } = useI18n()
const enumLabel = useEnumLabel()
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
    actionMessage.value = data.message || t('admin.requestDetail.statusChanged')
  } catch (e) {
    actionMessage.value = e.message || t('admin.genericError')
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
    actionMessage.value = data.message || t('admin.requestDetail.publishedMsg')
  } catch (e) {
    actionMessage.value = e.message || t('admin.genericError')
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
    actionMessage.value = data.message || t('admin.requestDetail.unpublishedMsg')
  } catch (e) {
    actionMessage.value = e.message || t('admin.genericError')
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function doDelete() {
  if (!confirm(t('admin.requestDetail.deleteConfirm'))) return
  actionLoading.value = true
  try {
    await deleteRequest(request.value.id)
    router.push('/admin/requests')
  } catch (e) {
    actionMessage.value = e.message || t('admin.genericError')
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
