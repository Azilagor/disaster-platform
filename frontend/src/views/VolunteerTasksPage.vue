<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Мои задачи</h1>
        <p class="text-muted">Доступные заявки для отклика и заявки, на которые вы записаны</p>
      </div>
    </div>

    <div class="tabs">
      <button
        type="button"
        class="tab"
        :class="tab === 'available' ? 'active' : ''"
        @click="tab = 'available'"
      >
        Доступные заявки
      </button>
      <button
        type="button"
        class="tab"
        :class="tab === 'assigned' ? 'active' : ''"
        @click="tab = 'assigned'"
      >
        Мои заявки
      </button>
    </div>

    <!-- Available -->
    <div v-show="tab === 'available'" class="section">
      <div class="toolbar">
        <select v-model="availableFilters.priority" class="form-control">
          <option value="">Все приоритеты</option>
          <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
        </select>
        <select v-model="availableFilters.problemType" class="form-control">
          <option value="">Все типы</option>
          <option v-for="t in ALLOWED_PROBLEM_TYPES" :key="t" :value="t">{{ PROBLEM_TYPE_LABELS[t] }}</option>
        </select>
        <select v-model="availableFilters.district" class="form-control">
          <option value="">Все районы</option>
          <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
        </select>
        <button type="button" class="btn btn-primary" @click="loadAvailable">Обновить</button>
      </div>
      <div class="request-cards">
        <div v-for="r in availableRequests" :key="r.id" class="request-card">
          <div class="request-card-header">
            <span class="priority-badge" :class="(r.priority || '').toLowerCase()">{{ PRIORITY_LABELS[r.priority] || r.priority }}</span>
            <span class="problem-type">{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</span>
          </div>
          <h3>{{ r.title }}</h3>
          <p class="request-address">{{ r.address }}</p>
          <p class="request-district">{{ DISTRICT_LABELS[r.district] || r.district }}</p>
          <p v-if="r.peopleCount" class="request-meta">Людей: {{ r.peopleCount }}</p>
          <div class="request-card-actions">
            <button
              v-if="!isRequestAssignedToMe(r.id)"
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="respondingId === r.id"
              @click="respondToRequest(r.id)"
            >
              {{ respondingId === r.id ? '...' : 'Откликнуться' }}
            </button>
            <span v-else class="already-responded-badge">Вы уже откликнулись</span>
          </div>
        </div>
      </div>
      <p v-if="availableLoading" class="text-muted">Загрузка...</p>
      <p v-else-if="tab === 'available' && !availableRequests.length" class="text-muted">Нет доступных заявок</p>
    </div>

    <!-- Assigned (my) -->
    <div v-show="tab === 'assigned'" class="section">
      <div class="toolbar">
        <select v-model="assignedFilters.status" class="form-control">
          <option value="">Все статусы</option>
          <option v-for="s in ALLOWED_STATUSES" :key="s" :value="s">{{ REQUEST_STATUS_LABELS[s] }}</option>
        </select>
        <button type="button" class="btn btn-primary" @click="loadAssigned">Обновить</button>
      </div>
      <div class="request-cards">
        <div v-for="r in assignedRequests" :key="r.id" class="request-card">
          <div class="request-card-header">
            <span class="priority-badge" :class="(r.priority || '').toLowerCase()">{{ PRIORITY_LABELS[r.priority] || r.priority }}</span>
            <span class="status-badge">{{ REQUEST_STATUS_LABELS[r.status] || r.status }}</span>
          </div>
          <h3>{{ r.title }}</h3>
          <p class="request-address">{{ r.address }}</p>
          <p class="request-district">{{ DISTRICT_LABELS[r.district] || r.district }}</p>
          <div class="request-card-actions">
            <button
              v-if="r.status !== 'DONE' && r.status !== 'CANCELLED'"
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="leavingId === r.id"
              @click="leaveRequest(r.id)"
            >
              {{ leavingId === r.id ? '...' : 'Отказаться от заявки' }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="assignedLoading" class="text-muted">Загрузка...</p>
      <p v-else-if="tab === 'assigned' && !assignedRequests.length" class="text-muted">Вы пока не записаны ни на одну заявку</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { getAvailableRequests, getRequestsAssigned, volunteerRespond, volunteerLeave } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'
import {
  ALLOWED_PRIORITIES,
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_DISTRICTS,
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
  DISTRICT_LABELS,
  REQUEST_STATUS_LABELS,
} from '../constants/requests.js'

const ALLOWED_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED']

const tab = ref('available')
const availableRequests = ref([])
const assignedRequests = ref([])
const availableLoading = ref(false)
const assignedLoading = ref(false)
const respondingId = ref(null)
const leavingId = ref(null)

const availableFilters = reactive({ priority: '', problemType: '', district: '', page: 1, limit: 50 })
const assignedFilters = reactive({ status: '', page: 1, limit: 50 })

async function loadAvailable() {
  availableLoading.value = true
  try {
    const params = { page: availableFilters.page, limit: availableFilters.limit }
    if (availableFilters.priority) params.priority = availableFilters.priority
    if (availableFilters.problemType) params.problemType = availableFilters.problemType
    if (availableFilters.district) params.district = availableFilters.district
    const data = await withLoading(() => getAvailableRequests(params))
    availableRequests.value = data.items ?? []
  } catch (e) {
    availableRequests.value = []
  } finally {
    availableLoading.value = false
  }
}

async function loadAssigned() {
  assignedLoading.value = true
  try {
    const params = { page: assignedFilters.page, limit: assignedFilters.limit }
    if (assignedFilters.status) params.status = assignedFilters.status
    const data = await withLoading(() => getRequestsAssigned(params))
    assignedRequests.value = data.items ?? []
  } catch (e) {
    assignedRequests.value = []
  } finally {
    assignedLoading.value = false
  }
}

watch(
  () => [availableFilters.priority, availableFilters.problemType, availableFilters.district],
  () => { if (tab.value === 'available') loadAvailable() },
  { immediate: true }
)
watch(
  () => assignedFilters.status,
  () => { if (tab.value === 'assigned') loadAssigned() },
  { immediate: true }
)
watch(tab, (t) => {
  if (t === 'available') {
    loadAvailable()
    loadAssigned() // needed to know which available requests we already responded to
  } else loadAssigned()
})

onMounted(() => {
  if (tab.value === 'available') loadAssigned()
})

async function respondToRequest(id) {
  respondingId.value = id
  try {
    await withLoading(() => volunteerRespond(id))
    loadAvailable()
    loadAssigned()
  } catch (e) {
    alert(e.message || 'Не удалось откликнуться')
  } finally {
    respondingId.value = null
  }
}

async function leaveRequest(id) {
  leavingId.value = id
  try {
    await withLoading(() => volunteerLeave(id))
    loadAssigned()
    loadAvailable()
  } catch (e) {
    alert(e.message || 'Не удалось отказаться')
  } finally {
    leavingId.value = null
  }
}

/** True if the current user is already assigned to this request (already responded). */
function isRequestAssignedToMe(requestId) {
  return assignedRequests.value.some((r) => r.id === requestId)
}
</script>

<style scoped>
.tabs { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
.tab { padding: 0.5rem 1rem; border: 1px solid #ddd; background: #f8f8f8; border-radius: 6px; cursor: pointer; }
.tab.active { background: var(--primary, #2563eb); color: #fff; border-color: var(--primary, #2563eb); }
.toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; }
.section { min-height: 200px; }
.request-cards { display: flex; flex-direction: column; gap: 1rem; }
.request-card { border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.request-card-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.priority-badge, .status-badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.priority-badge.critical, .priority-badge.high { background: #fee2e2; color: #991b1b; }
.priority-badge.medium { background: #fef3c7; color: #92400e; }
.priority-badge.low { background: #d1fae5; color: #065f46; }
.request-card h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.request-address, .request-district, .request-meta { margin: 0.25rem 0; font-size: 0.9rem; color: #555; }
.request-card-actions { margin-top: 0.75rem; }
.problem-type { font-size: 0.85rem; color: #666; }
.text-muted { color: #666; margin: 0; }
.already-responded-badge { font-size: 0.875rem; color: var(--gray-600); font-style: italic; }
</style>
