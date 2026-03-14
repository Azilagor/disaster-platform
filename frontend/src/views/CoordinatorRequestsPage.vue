<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Заявки координатора</h1>
        <p class="text-muted">Управление заявками: публикация, назначение, статусы</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Поиск..."
          class="form-control"
        />
      </div>
      <select v-model="filters.status" class="form-control">
        <option value="">Все статусы</option>
        <option v-for="s in ALLOWED_STATUSES" :key="s" :value="s">{{ REQUEST_STATUS_LABELS[s] }}</option>
      </select>
      <select v-model="filters.priority" class="form-control">
        <option value="">Все приоритеты</option>
        <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
      </select>
      <select v-model="filters.problemType" class="form-control">
        <option value="">Все типы</option>
        <option v-for="t in ALLOWED_PROBLEM_TYPES" :key="t" :value="t">{{ PROBLEM_TYPE_LABELS[t] }}</option>
      </select>
      <select v-model="filters.district" class="form-control">
        <option value="">Все районы</option>
        <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
      </select>
      <button type="button" class="btn btn-primary" @click="loadRequests">Обновить</button>
    </div>

    <div class="table-wrap">
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
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in requests" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.title }}</td>
            <td>{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</td>
            <td>{{ PRIORITY_LABELS[r.priority] || r.priority }}</td>
            <td>{{ DISTRICT_LABELS[r.district] || r.district }}</td>
            <td>
              <select
                :value="r.status"
                class="form-control form-control-sm"
                @change="patchRequestStatus(r.id, $event.target.value)"
              >
                <option :value="r.status">{{ REQUEST_STATUS_LABELS[r.status] }}</option>
                <option
                  v-for="next in (STATUS_TRANSITIONS[r.status] || [])"
                  :key="next"
                  :value="next"
                >
                  {{ REQUEST_STATUS_LABELS[next] }}
                </option>
              </select>
            </td>
            <td>
              <span v-if="r.isPublished" class="badge badge-success">Опубликована</span>
              <span v-else class="badge badge-secondary">Не опубликована</span>
            </td>
            <td class="actions-cell">
              <template v-if="r.isPublished">
                <button type="button" class="btn btn-sm btn-secondary" @click="unpublishRequest(r.id)">Снять</button>
              </template>
              <template v-else>
                <button type="button" class="btn btn-sm btn-primary" @click="publishRequest(r.id)">Опубликовать</button>
              </template>
              <button type="button" class="btn btn-sm btn-outline" @click="openAssignModal(r)">Назначить</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="text-muted">Загрузка...</p>
      <p v-else-if="!requests.length" class="text-muted">Нет заявок</p>
    </div>

    <!-- Assign modal -->
    <div v-if="assignModalRequest" class="modal" @click.self="assignModalRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Назначить волонтёра — заявка #{{ assignModalRequest.id }}</h2>
          <button type="button" class="modal-close" aria-label="Закрыть" @click="assignModalRequest = null">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="volunteer-search mb-3">
            <input
              v-model="volunteerSearch"
              type="text"
              class="form-control"
              placeholder="Поиск волонтёра..."
            />
          </div>
          <ul class="volunteer-list">
            <li v-for="v in volunteerList" :key="v.id" class="volunteer-item">
              <span>{{ v.firstName }} {{ v.lastName }}</span>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="assigningId === v.id"
                @click="assignVolunteer(assignModalRequest.id, v.id)"
              >
                Назначить
              </button>
            </li>
          </ul>
          <p v-if="volunteersLoading" class="text-muted">Загрузка волонтёров...</p>
          <p v-else-if="!volunteerList.length" class="text-muted">Нет волонтёров</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="assignModalRequest = null">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import {
  getRequests,
  publishRequest as apiPublishRequest,
  unpublishRequest as apiUnpublishRequest,
  patchRequestStatus as apiPatchRequestStatus,
  assignVolunteer as apiAssignVolunteer,
} from '../api/requests.js'
import { getVolunteers } from '../api/users.js'
import { withLoading } from '../stores/loading.js'
import {
  REQUEST_STATUS_LABELS,
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
  DISTRICT_LABELS,
  STATUS_TRANSITIONS,
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_PRIORITIES,
  ALLOWED_DISTRICTS,
} from '../constants/requests.js'

const ALLOWED_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED']

const loading = ref(false)
const requests = ref([])
const filters = reactive({
  status: '',
  priority: '',
  problemType: '',
  district: '',
  search: '',
  page: 1,
  limit: 20,
})

async function loadRequests() {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.problemType) params.problemType = filters.problemType
    if (filters.district) params.district = filters.district
    if (filters.search) params.search = filters.search
    params.page = filters.page
    params.limit = filters.limit
    const data = await withLoading(() => getRequests(params))
    requests.value = data.items ?? []
  } catch (e) {
    requests.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.status, filters.priority, filters.problemType, filters.district, filters.search],
  () => { loadRequests() },
  { immediate: true }
)

async function publishRequest(id) {
  try {
    await withLoading(() => apiPublishRequest(id))
    loadRequests()
  } catch (e) {
    alert(e.message || 'Ошибка публикации')
  }
}

async function unpublishRequest(id) {
  try {
    await withLoading(() => apiUnpublishRequest(id))
    loadRequests()
  } catch (e) {
    alert(e.message || 'Ошибка снятия')
  }
}

async function patchRequestStatus(id, status) {
  try {
    await withLoading(() => apiPatchRequestStatus(id, status))
    loadRequests()
  } catch (e) {
    alert(e.message || 'Ошибка смены статуса')
  }
}

const assignModalRequest = ref(null)
const volunteerList = ref([])
const volunteersLoading = ref(false)
const volunteerSearch = ref('')
const assigningId = ref(null)

watch(volunteerSearch, () => loadVolunteers())
watch(assignModalRequest, (r) => {
  if (r) {
    volunteerSearch.value = ''
    loadVolunteers()
  }
})

async function loadVolunteers() {
  if (!assignModalRequest.value) return
  volunteersLoading.value = true
  try {
    const data = await getVolunteers({ search: volunteerSearch.value, limit: 50 })
    volunteerList.value = data.items ?? []
  } catch (e) {
    volunteerList.value = []
  } finally {
    volunteersLoading.value = false
  }
}

function openAssignModal(request) {
  assignModalRequest.value = request
}

async function assignVolunteer(requestId, volunteerId) {
  assigningId.value = volunteerId
  try {
    await withLoading(() => apiAssignVolunteer(requestId, volunteerId))
    assignModalRequest.value = null
    loadRequests()
  } catch (e) {
    alert(e.message || 'Ошибка назначения')
  } finally {
    assigningId.value = null
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
}
.search-box input { min-width: 180px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th,
.data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; }
.actions-cell { white-space: nowrap; }
.actions-cell .btn { margin-right: 0.25rem; }
.badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85em; }
.badge-success { background: #d4edda; color: #155724; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.modal-content { position: relative; background: #fff; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1rem; }
.modal-footer { padding: 1rem; border-top: 1px solid #eee; }
.volunteer-list { list-style: none; padding: 0; margin: 0; }
.volunteer-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
.mb-3 { margin-bottom: 1rem; }
</style>
