<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Заявки</h1>
        <p class="text-muted">Публикация, назначение, управление статусами</p>
      </div>
      <div class="topbar-right">
        <!-- Переключатель вида -->
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'table' }"
            title="Таблица"
            @click="viewMode = 'table'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
            </svg>
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'kanban' }"
            title="Канбан"
            @click="viewMode = 'kanban'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="toolbar">
      <div class="search-box">
        <input v-model="filters.search" type="text" placeholder="Поиск..." class="form-control" />
      </div>
      <select v-if="viewMode === 'table'" v-model="filters.status" class="form-control">
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

    <!-- ── ТАБЛИЦА ─────────────────────────────────────────── -->
    <template v-if="viewMode === 'table'">
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
              <td class="td-id">{{ r.id }}</td>
              <td>{{ r.title }}</td>
              <td>{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</td>
              <td>
                <span class="priority-chip" :class="r.priority?.toLowerCase()">
                  {{ PRIORITY_LABELS[r.priority] || r.priority }}
                </span>
              </td>
              <td>{{ DISTRICT_LABELS[r.district] || r.district }}</td>
              <td>
                <select :value="r.status" class="form-control form-control-sm" @change="patchStatus(r.id, $event.target.value)">
                  <option :value="r.status">{{ REQUEST_STATUS_LABELS[r.status] }}</option>
                  <option v-for="next in (STATUS_TRANSITIONS[r.status] || [])" :key="next" :value="next">
                    {{ REQUEST_STATUS_LABELS[next] }}
                  </option>
                </select>
              </td>
              <td>
                <span v-if="r.isPublished" class="badge badge-success">Опубликована</span>
                <span v-else class="badge badge-secondary">Не опубликована</span>
              </td>
              <td class="actions-cell">
                <button type="button" class="btn btn-sm btn-outline" @click="openEditModal(r)">Редактировать</button>
                <button v-if="r.isPublished" type="button" class="btn btn-sm btn-secondary" @click="doUnpublish(r.id)">Снять</button>
                <button v-else type="button" class="btn btn-sm btn-primary" @click="doPublish(r.id)">Опубликовать</button>
                <button type="button" class="btn btn-sm btn-outline" @click="openAssignModal(r)">Назначить</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="loading" class="text-muted mt-2">Загрузка...</p>
        <p v-else-if="!requests.length" class="text-muted mt-2">Нет заявок</p>
      </div>
    </template>

    <!-- ── КАНБАН ──────────────────────────────────────────── -->
    <template v-else>
      <div v-if="loading" class="text-muted mt-2">Загрузка...</div>
      <div v-else class="kanban-board">
        <div
          v-for="col in kanbanColumns"
          :key="col.status"
          class="kanban-col"
          :class="'kanban-col--' + col.status.toLowerCase()"
        >
          <!-- Заголовок колонки -->
          <div class="kanban-col-header">
            <div class="kanban-col-title">
              <span class="kanban-col-dot" :class="'dot--' + col.status.toLowerCase()"></span>
              {{ col.label }}
            </div>
            <span class="kanban-col-count">{{ col.items.length }}</span>
          </div>

          <!-- Карточки -->
          <div class="kanban-cards">
            <div
              v-for="r in col.items"
              :key="r.id"
              class="kanban-card"
              :class="'kanban-card--' + (r.priority || 'medium').toLowerCase()"
            >
              <!-- Приоритет + тип -->
              <div class="kanban-card-meta">
                <span class="priority-chip" :class="r.priority?.toLowerCase()">
                  {{ PRIORITY_LABELS[r.priority] || r.priority }}
                </span>
                <span class="kc-type">{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</span>
              </div>

              <!-- Заголовок -->
              <div class="kanban-card-title">{{ r.title }}</div>

              <!-- Район + люди -->
              <div class="kanban-card-info">
                <span>📍 {{ DISTRICT_LABELS[r.district] || r.district }}</span>
                <span v-if="r.peopleCount > 1">👥 {{ r.peopleCount }}</span>
              </div>

              <!-- Волонтёры -->
              <div v-if="r.volunteers?.length" class="kanban-card-volunteers">
                <span
                  v-for="v in r.volunteers.slice(0, 3)"
                  :key="v.volunteer.id"
                  class="vol-avatar"
                  :title="v.volunteer.firstName + ' ' + v.volunteer.lastName"
                >
                  {{ v.volunteer.firstName?.[0] }}{{ v.volunteer.lastName?.[0] }}
                </span>
                <span v-if="r.volunteers.length > 3" class="vol-more">+{{ r.volunteers.length - 3 }}</span>
              </div>

              <!-- Публикация -->
              <div class="kanban-card-pub">
                <span v-if="r.isPublished" class="badge badge-success">Опубликована</span>
                <span v-else class="badge badge-secondary">Не опубликована</span>
              </div>

              <!-- Действия -->
              <div class="kanban-card-actions">
                <!-- Переход статуса -->
                <template v-if="STATUS_TRANSITIONS[r.status]?.length">
                  <button
                    v-for="next in STATUS_TRANSITIONS[r.status]"
                    :key="next"
                    type="button"
                    class="kc-btn kc-btn-status"
                    :class="'kc-btn--' + next.toLowerCase()"
                    :disabled="movingId === r.id"
                    @click="patchStatus(r.id, next)"
                  >
                    {{ STATUS_ARROWS[next] }} {{ REQUEST_STATUS_LABELS[next] }}
                  </button>
                </template>

                <div class="kc-btn-row">
                  <!-- Публикация -->
                  <button
                    v-if="!r.isPublished"
                    type="button"
                    class="kc-btn kc-btn-publish"
                    @click="doPublish(r.id)"
                  >
                    Опубликовать
                  </button>
                  <button
                    v-else
                    type="button"
                    class="kc-btn kc-btn-unpublish"
                    @click="doUnpublish(r.id)"
                  >
                    Снять
                  </button>

                  <button type="button" class="kc-btn kc-btn-assign" @click="openAssignModal(r)">
                    Назначить
                  </button>

                  <button type="button" class="kc-btn kc-btn-edit" @click="openEditModal(r)">
                    ✏️
                  </button>
                </div>
              </div>
            </div>

            <!-- Пустая колонка -->
            <div v-if="!col.items.length" class="kanban-empty">
              Нет заявок
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Модалка назначения волонтёра ───────────────────── -->
    <div v-if="assignModalRequest" class="modal" @click.self="assignModalRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Назначить волонтёра — #{{ assignModalRequest.id }}</h2>
          <button type="button" class="modal-close" @click="assignModalRequest = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <input v-model="volunteerSearch" type="text" class="form-control" placeholder="Поиск волонтёра..." />
          </div>
          <ul class="volunteer-list">
            <li v-for="v in volunteerList" :key="v.id" class="volunteer-item">
              <div class="vol-info">
                <span class="vol-name">{{ v.firstName }} {{ v.lastName }}</span>
                <span v-if="v.district" class="vol-district">{{ DISTRICT_LABELS[v.district] || v.district }}</span>
              </div>
              <button type="button" class="btn btn-sm btn-primary" :disabled="assigningId === v.id" @click="doAssignVolunteer(assignModalRequest.id, v.id)">
                {{ assigningId === v.id ? '...' : 'Назначить' }}
              </button>
            </li>
          </ul>
          <p v-if="volunteersLoading" class="text-muted">Загрузка...</p>
          <p v-else-if="!volunteerList.length" class="text-muted">Нет волонтёров</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="assignModalRequest = null">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- ── Модалка редактирования ─────────────────────────── -->
    <div v-if="editModalRequest" class="modal" @click.self="editModalRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content modal-content-wide">
        <div class="modal-header">
          <h2>Редактировать заявку #{{ editModalRequest.id }}</h2>
          <button type="button" class="modal-close" @click="editModalRequest = null">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="editError" class="auth-message auth-message-error">{{ editError }}</div>
          <form class="edit-request-form" @submit.prevent="submitEditRequest">
            <div class="form-group">
              <label>Заголовок</label>
              <input v-model="editForm.title" type="text" class="form-control" required minlength="5" maxlength="200" />
            </div>
            <div class="form-group">
              <label>Описание</label>
              <textarea v-model="editForm.description" class="form-control" rows="4" required minlength="50"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Приоритет</label>
                <select v-model="editForm.priority" class="form-control">
                  <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Тип помощи</label>
                <select v-model="editForm.problemType" class="form-control">
                  <option v-for="t in ALLOWED_PROBLEM_TYPES" :key="t" :value="t">{{ PROBLEM_TYPE_LABELS[t] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Кол-во людей</label>
                <input v-model.number="editForm.peopleCount" type="number" class="form-control" min="1" max="1000" />
              </div>
            </div>
            <div class="form-group">
              <label>Адрес</label>
              <input v-model="editForm.address" type="text" class="form-control" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Район</label>
                <select v-model="editForm.district" class="form-control">
                  <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Ориентир</label>
                <input v-model="editForm.landmark" type="text" class="form-control" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Контактное лицо</label>
                <input v-model="editForm.contactName" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Телефон</label>
                <input v-model="editForm.contactPhone" type="tel" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Доп. информация</label>
              <textarea v-model="editForm.additionalInfo" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="editModalRequest = null">Отмена</button>
              <button type="submit" class="btn btn-primary" :disabled="editSaving">
                {{ editSaving ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  getRequests,
  getRequest,
  updateRequest,
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

// Иконки переходов в канбане
const STATUS_ARROWS = {
  NEW:         '↩',
  IN_PROGRESS: '▶',
  DONE:        '✅',
  CANCELLED:   '✖',
}

// ── Вид ───────────────────────────────────────────────────────
const viewMode = ref('table')

// ── Данные ────────────────────────────────────────────────────
const loading  = ref(false)
const requests = ref([])
const movingId = ref(null)

const filters = reactive({
  status: '', priority: '', problemType: '', district: '', search: '',
  page: 1, limit: 100,  // В канбане грузим больше
})

// ── Канбан: группировка по статусу ───────────────────────────
const KANBAN_COLS = [
  { status: 'NEW',         label: 'Новые' },
  { status: 'IN_PROGRESS', label: 'В работе' },
  { status: 'DONE',        label: 'Выполнены' },
  { status: 'CANCELLED',   label: 'Отменены' },
]

const kanbanColumns = computed(() => {
  const search = filters.search.trim().toLowerCase()
  return KANBAN_COLS.map((col) => ({
    ...col,
    items: requests.value.filter((r) => {
      if (r.status !== col.status) return false
      if (search && !r.title.toLowerCase().includes(search) && !r.address?.toLowerCase().includes(search)) return false
      if (filters.priority && r.priority !== filters.priority) return false
      if (filters.problemType && r.problemType !== filters.problemType) return false
      if (filters.district && r.district !== filters.district) return false
      return true
    }),
  }))
})

// ── Загрузка ──────────────────────────────────────────────────
async function loadRequests() {
  loading.value = true
  try {
    const params = {}
    if (filters.priority)    params.priority    = filters.priority
    if (filters.problemType) params.problemType = filters.problemType
    if (filters.district)    params.district    = filters.district
    if (filters.search)      params.search      = filters.search
    // В канбане грузим все статусы; в таблице — с фильтром
    if (viewMode.value === 'table' && filters.status) params.status = filters.status
    params.page  = 1
    params.limit = viewMode.value === 'kanban' ? 200 : filters.limit
    const data = await withLoading(() => getRequests(params))
    requests.value = data.items ?? []
  } catch {
    requests.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.status, filters.priority, filters.problemType, filters.district, filters.search],
  () => loadRequests(),
  { immediate: true }
)

watch(viewMode, () => loadRequests())

// ── Действия ──────────────────────────────────────────────────
async function doPublish(id) {
  try { await withLoading(() => apiPublishRequest(id)); loadRequests() }
  catch (e) { alert(e.message || 'Ошибка публикации') }
}

async function doUnpublish(id) {
  try { await withLoading(() => apiUnpublishRequest(id)); loadRequests() }
  catch (e) { alert(e.message || 'Ошибка снятия') }
}

async function patchStatus(id, status) {
  movingId.value = id
  try { await withLoading(() => apiPatchRequestStatus(id, status)); loadRequests() }
  catch (e) { alert(e.message || 'Ошибка смены статуса') }
  finally { movingId.value = null }
}

// ── Назначение волонтёра ──────────────────────────────────────
const assignModalRequest = ref(null)
const volunteerList      = ref([])
const volunteersLoading  = ref(false)
const volunteerSearch    = ref('')
const assigningId        = ref(null)

watch(volunteerSearch, () => loadVolunteers())
watch(assignModalRequest, (r) => { if (r) { volunteerSearch.value = ''; loadVolunteers() } })

async function loadVolunteers() {
  if (!assignModalRequest.value) return
  volunteersLoading.value = true
  try {
    const data = await getVolunteers({ search: volunteerSearch.value, limit: 50 })
    volunteerList.value = data.items ?? []
  } catch { volunteerList.value = [] }
  finally { volunteersLoading.value = false }
}

function openAssignModal(request) { assignModalRequest.value = request }

async function doAssignVolunteer(requestId, volunteerId) {
  assigningId.value = volunteerId
  try {
    await withLoading(() => apiAssignVolunteer(requestId, volunteerId))
    assignModalRequest.value = null
    loadRequests()
  } catch (e) { alert(e.message || 'Ошибка назначения') }
  finally { assigningId.value = null }
}

// ── Редактирование ────────────────────────────────────────────
const editModalRequest = ref(null)
const editSaving       = ref(false)
const editError        = ref('')
const editForm = reactive({
  title: '', description: '', priority: 'MEDIUM', problemType: 'MEDICAL',
  peopleCount: 1, address: '', district: 'ALMALYNSKIY',
  landmark: '', contactName: '', contactPhone: '', additionalInfo: '',
})

async function openEditModal(request) {
  editModalRequest.value = request
  editError.value = ''
  Object.assign(editForm, {
    title: request.title ?? '', description: request.description ?? '',
    priority: request.priority ?? 'MEDIUM', problemType: request.problemType ?? 'MEDICAL',
    peopleCount: request.peopleCount ?? 1, address: request.address ?? '',
    district: request.district ?? 'ALMALYNSKIY', landmark: request.landmark ?? '',
    contactName: request.contactName ?? '', contactPhone: request.contactPhone ?? '',
    additionalInfo: request.additionalInfo ?? '',
  })
  try {
    const full = await getRequest(request.id)
    editModalRequest.value = full
    Object.assign(editForm, {
      title: full.title ?? '', description: full.description ?? '',
      priority: full.priority ?? 'MEDIUM', problemType: full.problemType ?? 'MEDICAL',
      peopleCount: full.peopleCount ?? 1, address: full.address ?? '',
      district: full.district ?? 'ALMALYNSKIY', landmark: full.landmark ?? '',
      contactName: full.contactName ?? '', contactPhone: full.contactPhone ?? '',
      additionalInfo: full.additionalInfo ?? '',
    })
  } catch (e) { editError.value = e.message || 'Не удалось загрузить заявку' }
}

async function submitEditRequest() {
  if (!editModalRequest.value) return
  editError.value = ''
  editSaving.value = true
  try {
    await withLoading(() => updateRequest(editModalRequest.value.id, {
      title:          editForm.title.trim(),
      description:    editForm.description.trim(),
      priority:       editForm.priority,
      problemType:    editForm.problemType,
      peopleCount:    editForm.peopleCount || 1,
      address:        editForm.address.trim(),
      district:       editForm.district,
      landmark:       editForm.landmark.trim() || undefined,
      contactName:    editForm.contactName.trim(),
      contactPhone:   editForm.contactPhone.trim(),
      additionalInfo: editForm.additionalInfo.trim() || undefined,
    }))
    editModalRequest.value = null
    loadRequests()
  } catch (e) { editError.value = e.message || 'Не удалось сохранить заявку' }
  finally { editSaving.value = false }
}
</script>

<style scoped>
/* ── Переключатель вида ──────────────────────────────────── */
.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.topbar-right { flex-shrink: 0; }
.view-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.view-btn {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 30px;
  background: none; border: none; border-radius: 6px;
  color: #6b7280; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.view-btn:hover { background: #e5e7eb; color: #374151; }
.view-btn.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,.1); }

/* ── Toolbar ────────────────────────────────────────────── */
.toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; }
.search-box input { min-width: 180px; }
.text-muted { color: #6b7280; font-size: 0.9rem; }
.mt-2 { margin-top: 0.5rem; }

/* ── Таблица ────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 0.65rem 0.75rem; font-size: 0.82rem; font-weight: 600; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; text-align: left; }
.data-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
.td-id { color: #9ca3af; font-size: 0.82rem; }
.actions-cell { white-space: nowrap; }
.actions-cell .btn { margin-right: 0.25rem; }

/* ── Приоритет/статус чипы ──────────────────────────────── */
.priority-chip { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.priority-chip.critical { background: #fee2e2; color: #991b1b; }
.priority-chip.high     { background: #ffedd5; color: #9a3412; }
.priority-chip.medium   { background: #fef9c3; color: #854d0e; }
.priority-chip.low      { background: #dcfce7; color: #166534; }
.badge { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.78rem; }
.badge-success   { background: #d4edda; color: #155724; }
.badge-secondary { background: #e2e3e5; color: #383d41; }

/* ── Канбан доска ───────────────────────────────────────── */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  align-items: start;
}
@media (max-width: 1100px) { .kanban-board { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .kanban-board { grid-template-columns: 1fr; } }

.kanban-col {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  min-height: 200px;
}

.kanban-col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
.kanban-col-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; }
.kanban-col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot--new         { background: #3b82f6; }
.dot--in_progress { background: #f59e0b; }
.dot--done        { background: #10b981; }
.dot--cancelled   { background: #9ca3af; }
.kanban-col-count {
  min-width: 22px; height: 22px; padding: 0 6px;
  background: #e5e7eb; color: #374151;
  border-radius: 11px; font-size: 0.75rem; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
}

.kanban-cards { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.65rem; }

/* ── Карточка канбан ────────────────────────────────────── */
.kanban-card {
  background: #fff;
  border-radius: 10px;
  padding: 0.85rem;
  border: 1px solid #e5e7eb;
  border-left: 3px solid transparent;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  transition: box-shadow 0.15s;
}
.kanban-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,.08); }

.kanban-card--critical { border-left-color: #dc2626; }
.kanban-card--high     { border-left-color: #ea580c; }
.kanban-card--medium   { border-left-color: #d97706; }
.kanban-card--low      { border-left-color: #059669; }

.kanban-card-meta { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; }
.kc-type { font-size: 0.75rem; color: #6b7280; }

.kanban-card-title { font-size: 0.88rem; font-weight: 600; color: #1f2937; margin-bottom: 0.4rem; line-height: 1.35; }

.kanban-card-info { display: flex; gap: 0.75rem; font-size: 0.78rem; color: #6b7280; margin-bottom: 0.5rem; }

.kanban-card-volunteers { display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.5rem; }
.vol-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: #dbeafe; color: #1d4ed8;
  font-size: 0.65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #fff;
}
.vol-more { font-size: 0.72rem; color: #6b7280; }

.kanban-card-pub { margin-bottom: 0.6rem; }

.kanban-card-actions { display: flex; flex-direction: column; gap: 0.35rem; }

.kc-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.3rem 0.6rem; border-radius: 6px;
  font-size: 0.78rem; font-weight: 500; cursor: pointer;
  border: 1px solid transparent; transition: opacity 0.15s;
}
.kc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.kc-btn-status { width: 100%; }
.kc-btn--in_progress { background: #fef3c7; color: #92400e; border-color: #fde68a; }
.kc-btn--done        { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.kc-btn--cancelled   { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }
.kc-btn--new         { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }

.kc-btn-row { display: flex; gap: 0.35rem; }
.kc-btn-publish   { background: #2563eb; color: #fff; flex: 1; }
.kc-btn-unpublish { background: #f3f4f6; color: #374151; border-color: #e5e7eb; flex: 1; }
.kc-btn-assign    { background: #f0fdf4; color: #166534; border-color: #bbf7d0; flex: 1; }
.kc-btn-edit      { background: #f8fafc; color: #374151; border-color: #e5e7eb; }

.kanban-empty { text-align: center; color: #9ca3af; font-size: 0.85rem; padding: 1.5rem 0; }

/* ── Модалки ────────────────────────────────────────────── */
.modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.modal-content { position: relative; background: #fff; border-radius: 10px; max-width: 500px; width: 90%; max-height: 85vh; overflow: auto; }
.modal-content-wide { max-width: 560px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #eee; }
.modal-header h2 { margin: 0; font-size: 1.05rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; line-height: 1; }
.modal-close:hover { color: #111; }
.modal-body { padding: 1.25rem; }
.modal-footer { padding: 1rem 1.25rem; border-top: 1px solid #eee; }
.mb-3 { margin-bottom: 1rem; }

.volunteer-list { list-style: none; padding: 0; margin: 0; }
.volunteer-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f0f0f0; }
.vol-info { display: flex; flex-direction: column; gap: 0.1rem; }
.vol-name { font-size: 0.9rem; font-weight: 500; }
.vol-district { font-size: 0.78rem; color: #6b7280; }

.edit-request-form .form-group { margin-bottom: 1rem; }
.edit-request-form .form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
.form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>