<template>
  <div>
    <div style="margin-bottom: var(--spacing-lg);">
      <router-link to="/requests" class="btn btn-secondary">← К списку</router-link>
    </div>
    <div v-if="loading" class="card">Загрузка…</div>
    <template v-else-if="request">
      <div class="card">
        <h1 class="page-title">Заявка #{{ request.id }}</h1>
        <dl style="display: grid; gap: var(--spacing-sm);">
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Заголовок</dt><dd>{{ request.title }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Описание</dt><dd>{{ request.description || '—' }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Статус</dt><dd><span class="badge">{{ request.status }}</span></dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Приоритет</dt><dd>{{ request.priority }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Тип</dt><dd>{{ request.problemType }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Район</dt><dd>{{ request.district }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Адрес</dt><dd>{{ request.address || '—' }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Опубликовано</dt><dd>{{ request.isPublished ? 'Да' : 'Нет' }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Создатель</dt><dd>{{ request.createdBy ? [request.createdBy.firstName, request.createdBy.lastName].filter(Boolean).join(' ') : '—' }}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-md);">Действия</h2>
        <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap; align-items: center;">
          <select v-model="statusSelect" class="form-control" style="max-width: 160px;">
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="setStatus">Изменить статус</button>
          <template v-if="request.status !== 'DONE' && request.status !== 'CANCELLED'">
            <button v-if="!request.isPublished" type="button" class="btn btn-primary" :disabled="actionLoading" @click="publish">Опубликовать</button>
            <button v-else type="button" class="btn btn-secondary" :disabled="actionLoading" @click="unpublish">Снять с публикации</button>
          </template>
          <button type="button" class="btn btn-danger" :disabled="actionLoading" @click="doDelete">Удалить заявку</button>
          <span v-if="actionMessage" :class="actionError ? 'form-error' : ''" style="margin-left: 8px;">{{ actionMessage }}</span>
        </div>
      </div>
    </template>
    <div v-else class="card">Заявка не найдена</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRequest, setRequestStatus, publishRequest, unpublishRequest, deleteRequest } from '../api/requests.js'

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
    const data = await setRequestStatus(request.value.id, statusSelect.value)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || 'Статус изменён'
  } catch (e) {
    actionMessage.value = e.message || 'Ошибка'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function publish() {
  actionMessage.value = ''
  actionError.value = false
  actionLoading.value = true
  try {
    const data = await publishRequest(request.value.id)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || 'Опубликовано'
  } catch (e) {
    actionMessage.value = e.message || 'Ошибка'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function unpublish() {
  actionMessage.value = ''
  actionError.value = false
  actionLoading.value = true
  try {
    const data = await unpublishRequest(request.value.id)
    if (data.request) request.value = data.request
    actionMessage.value = data.message || 'Снято с публикации'
  } catch (e) {
    actionMessage.value = e.message || 'Ошибка'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function doDelete() {
  if (!confirm('Удалить заявку? Это действие необратимо.')) return
  actionMessage.value = ''
  actionLoading.value = true
  try {
    await deleteRequest(request.value.id)
    router.push('/requests')
  } catch (e) {
    actionMessage.value = e.message || 'Ошибка удаления'
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}
</script>
