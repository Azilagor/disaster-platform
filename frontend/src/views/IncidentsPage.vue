<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Инциденты</h1>
        <p class="text-muted">ЧС: список, создание, редактирование, смена статуса</p>
      </div>
      <div class="topbar-right">
        <button type="button" class="btn btn-primary" @click="openCreateModal">Создать инцидент</button>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="filters.severity" class="form-control">
        <option value="">Все степени</option>
        <option v-for="s in ALLOWED_SEVERITIES" :key="s" :value="s">{{ SEVERITY_LABELS[s] }}</option>
      </select>
      <select v-model="filters.status" class="form-control">
        <option value="">Все статусы</option>
        <option v-for="s in ALLOWED_INCIDENT_STATUSES" :key="s" :value="s">{{ INCIDENT_STATUS_LABELS[s] }}</option>
      </select>
      <select v-model="filters.district" class="form-control">
        <option value="">Все районы</option>
        <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
      </select>
      <button type="button" class="btn btn-primary" @click="loadIncidents">Обновить</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Заголовок</th>
            <th>Степень</th>
            <th>Район</th>
            <th>Статус</th>
            <th>Создан</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inc in incidents" :key="inc.id">
            <td>{{ inc.id }}</td>
            <td>{{ inc.title }}</td>
            <td>{{ SEVERITY_LABELS[inc.severity] || inc.severity }}</td>
            <td>{{ DISTRICT_LABELS[inc.district] || inc.district }}</td>
            <td>
              <select
                :value="inc.status"
                class="form-control form-control-sm"
                :disabled="!incidentStatusTransitions[inc.status]?.length"
                @change="patchIncidentStatus(inc.id, $event.target.value)"
              >
                <option :value="inc.status">{{ INCIDENT_STATUS_LABELS[inc.status] }}</option>
                <option
                  v-for="next in (incidentStatusTransitions[inc.status] || [])"
                  :key="next"
                  :value="next"
                >
                  {{ INCIDENT_STATUS_LABELS[next] }}
                </option>
              </select>
            </td>
            <td>{{ formatDate(inc.createdAt) }}</td>
            <td class="actions-cell">
              <button type="button" class="btn btn-sm btn-outline" @click="openEditModal(inc)">Изменить</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="text-muted">Загрузка...</p>
      <p v-else-if="!incidents.length" class="text-muted">Нет инцидентов</p>
    </div>

    <!-- Create modal -->
    <div v-if="createModalOpen" class="modal" @click.self="createModalOpen = false">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Создать инцидент</h2>
          <button type="button" class="modal-close" aria-label="Закрыть" @click="createModalOpen = false">&times;</button>
        </div>
        <form class="modal-body" @submit.prevent="submitCreate">
          <div class="form-group">
            <label for="create-title">Заголовок</label>
            <input id="create-title" v-model="createForm.title" type="text" class="form-control" placeholder="5–200 символов" />
            <span v-if="createErrors.title" class="form-error">{{ createErrors.title }}</span>
          </div>
          <div class="form-group">
            <label for="create-description">Описание</label>
            <textarea id="create-description" v-model="createForm.description" class="form-control" rows="3" placeholder="Минимум 20 символов"></textarea>
            <span v-if="createErrors.description" class="form-error">{{ createErrors.description }}</span>
          </div>
          <div class="form-group">
            <label for="create-severity">Степень</label>
            <select id="create-severity" v-model="createForm.severity" class="form-control">
              <option value="">Выберите</option>
              <option v-for="s in ALLOWED_SEVERITIES" :key="s" :value="s">{{ SEVERITY_LABELS[s] }}</option>
            </select>
            <span v-if="createErrors.severity" class="form-error">{{ createErrors.severity }}</span>
          </div>
          <div class="form-group">
            <label for="create-district">Район</label>
            <select id="create-district" v-model="createForm.district" class="form-control">
              <option value="">Выберите</option>
              <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
            </select>
            <span v-if="createErrors.district" class="form-error">{{ createErrors.district }}</span>
          </div>
          <div v-if="createError" class="auth-message auth-message-error">{{ createError }}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="createModalOpen = false">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="creating">Создать</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editIncident" class="modal" @click.self="editIncident = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Изменить инцидент #{{ editIncident.id }}</h2>
          <button type="button" class="modal-close" aria-label="Закрыть" @click="editIncident = null">&times;</button>
        </div>
        <form class="modal-body" @submit.prevent="submitEdit">
          <div class="form-group">
            <label>Заголовок</label>
            <input v-model="editForm.title" type="text" class="form-control" />
            <span v-if="editErrors.title" class="form-error">{{ editErrors.title }}</span>
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="editForm.description" class="form-control" rows="3"></textarea>
            <span v-if="editErrors.description" class="form-error">{{ editErrors.description }}</span>
          </div>
          <div class="form-group">
            <label>Степень</label>
            <select v-model="editForm.severity" class="form-control">
              <option v-for="s in ALLOWED_SEVERITIES" :key="s" :value="s">{{ SEVERITY_LABELS[s] }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Район</label>
            <select v-model="editForm.district" class="form-control">
              <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
            </select>
          </div>
          <div v-if="editError" class="auth-message auth-message-error">{{ editError }}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="editIncident = null">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import {
  getIncidents,
  createIncident,
  getIncident,
  updateIncident,
  patchIncidentStatus as apiPatchIncidentStatus,
} from '../api/incidents.js'
import { withLoading } from '../stores/loading.js'
import {
  ALLOWED_SEVERITIES,
  ALLOWED_INCIDENT_STATUSES,
  SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  incidentStatusTransitions,
} from '../constants/incidents.js'
import { ALLOWED_DISTRICTS, DISTRICT_LABELS } from '../constants/requests.js'

const loading = ref(false)
const incidents = ref([])
const filters = reactive({ severity: '', status: '', district: '', page: 1, limit: 50 })

async function loadIncidents() {
  loading.value = true
  try {
    const params = {}
    if (filters.severity) params.severity = filters.severity
    if (filters.status) params.status = filters.status
    if (filters.district) params.district = filters.district
    params.page = filters.page
    params.limit = filters.limit
    const data = await withLoading(() => getIncidents(params))
    incidents.value = data.items ?? []
  } catch (e) {
    incidents.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.severity, filters.status, filters.district],
  () => loadIncidents(),
  { immediate: true }
)

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

async function patchIncidentStatus(id, status) {
  try {
    await withLoading(() => apiPatchIncidentStatus(id, status))
    loadIncidents()
  } catch (e) {
    alert(e.message || 'Ошибка смены статуса')
  }
}

// Create
const createModalOpen = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = reactive({ title: '', description: '', severity: '', district: '' })
const createErrors = reactive({ title: '', description: '', severity: '', district: '' })

function openCreateModal() {
  createForm.title = ''
  createForm.description = ''
  createForm.severity = 'MEDIUM'
  createForm.district = ''
  createErrors.title = ''
  createErrors.description = ''
  createErrors.severity = ''
  createErrors.district = ''
  createError.value = ''
  createModalOpen.value = true
}

function validateCreate() {
  let ok = true
  const t = (createForm.title || '').trim()
  const d = (createForm.description || '').trim()
  if (t.length < 5 || t.length > 200) {
    createErrors.title = 'Заголовок: от 5 до 200 символов'
    ok = false
  } else createErrors.title = ''
  if (d.length < 20) {
    createErrors.description = 'Описание: минимум 20 символов'
    ok = false
  } else createErrors.description = ''
  if (!createForm.severity) {
    createErrors.severity = 'Выберите степень'
    ok = false
  } else createErrors.severity = ''
  if (!createForm.district) {
    createErrors.district = 'Выберите район'
    ok = false
  } else createErrors.district = ''
  return ok
}

async function submitCreate() {
  createError.value = ''
  if (!validateCreate()) return
  creating.value = true
  try {
    await withLoading(() =>
      createIncident({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        severity: createForm.severity,
        district: createForm.district,
      })
    )
    createModalOpen.value = false
    loadIncidents()
  } catch (e) {
    createError.value = e.message || 'Не удалось создать инцидент'
  } finally {
    creating.value = false
  }
}

// Edit
const editIncident = ref(null)
const editForm = reactive({ title: '', description: '', severity: '', district: '' })
const editErrors = reactive({ title: '', description: '' })
const editError = ref('')
const saving = ref(false)

async function openEditModal(inc) {
  try {
    const full = await getIncident(inc.id)
    editIncident.value = full
    editForm.title = full.title ?? ''
    editForm.description = full.description ?? ''
    editForm.severity = full.severity ?? ''
    editForm.district = full.district ?? ''
    editErrors.title = ''
    editErrors.description = ''
    editError.value = ''
  } catch (e) {
    alert(e.message || 'Не удалось загрузить инцидент')
  }
}

function validateEdit() {
  let ok = true
  const t = (editForm.title || '').trim()
  const d = (editForm.description || '').trim()
  if (t.length < 5 || t.length > 200) {
    editErrors.title = 'Заголовок: от 5 до 200 символов'
    ok = false
  } else editErrors.title = ''
  if (d.length < 20) {
    editErrors.description = 'Описание: минимум 20 символов'
    ok = false
  } else editErrors.description = ''
  return ok
}

async function submitEdit() {
  if (!editIncident.value) return
  editError.value = ''
  if (!validateEdit()) return
  saving.value = true
  try {
    await withLoading(() =>
      updateIncident(editIncident.value.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        severity: editForm.severity,
        district: editForm.district,
      })
    )
    editIncident.value = null
    loadIncidents()
  } catch (e) {
    editError.value = e.message || 'Не удалось сохранить'
  } finally {
    saving.value = false
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
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th,
.data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; }
.actions-cell { white-space: nowrap; }
.form-error { color: #c00; font-size: 0.9rem; }
.modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.modal-content { position: relative; background: #fff; border-radius: 8px; max-width: 480px; width: 90%; max-height: 90vh; overflow: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 1rem; }
.modal-body .form-group { margin-bottom: 1rem; }
.modal-footer { padding: 1rem; border-top: 1px solid #eee; display: flex; gap: 0.5rem; justify-content: flex-end; }
.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.topbar-right { flex-shrink: 0; }
.text-muted { color: #666; font-size: 0.95rem; margin: 0; }
</style>
