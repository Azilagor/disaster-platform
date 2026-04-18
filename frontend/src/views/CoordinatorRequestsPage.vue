<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ $t('coordinator.title') }}</h1>
        <p class="text-muted">{{ $t('coordinator.subtitle') }}</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="filters.search"
          type="text"
          :placeholder="$t('coordinator.searchPh')"
          class="form-control"
        />
      </div>
      <select v-model="filters.status" class="form-control">
        <option value="">{{ $t('coordinator.allStatuses') }}</option>
        <option v-for="s in ALLOWED_STATUSES" :key="s" :value="s">{{ requestStatusLabels[s] }}</option>
      </select>
      <select v-model="filters.priority" class="form-control">
        <option value="">{{ $t('coordinator.allPriorities') }}</option>
        <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ priorityLabels[p] }}</option>
      </select>
      <select v-model="filters.problemType" class="form-control">
        <option value="">{{ $t('coordinator.allTypes') }}</option>
        <option v-for="pt in ALLOWED_PROBLEM_TYPES" :key="pt" :value="pt">{{ problemTypeLabels[pt] }}</option>
      </select>
      <select v-model="filters.district" class="form-control">
        <option value="">{{ $t('coordinator.allDistricts') }}</option>
        <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ districtLabels[d] }}</option>
      </select>
      <button type="button" class="btn btn-primary" @click="loadRequests">{{ $t('common.refresh') }}</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ $t('myRequests.thTitle') }}</th>
            <th>{{ $t('myRequests.thType') }}</th>
            <th>{{ $t('myRequests.thPriority') }}</th>
            <th>{{ $t('myRequests.thDistrict') }}</th>
            <th>{{ $t('myRequests.thStatus') }}</th>
            <th>{{ $t('myRequests.thPublished') }}</th>
            <th>{{ $t('coordinator.thActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in requests" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.title }}</td>
            <td>{{ problemTypeLabels[r.problemType] || r.problemType }}</td>
            <td>{{ priorityLabels[r.priority] || r.priority }}</td>
            <td>{{ districtLabels[r.district] || r.district }}</td>
            <td>
              <select
                :value="r.status"
                class="form-control form-control-sm"
                @change="patchRequestStatus(r.id, $event.target.value)"
              >
                <option :value="r.status">{{ requestStatusLabels[r.status] }}</option>
                <option
                  v-for="next in (STATUS_TRANSITIONS[r.status] || [])"
                  :key="next"
                  :value="next"
                >
                  {{ requestStatusLabels[next] }}
                </option>
              </select>
            </td>
            <td>
              <span v-if="r.isPublished" class="badge badge-success">{{ $t('myRequests.published') }}</span>
              <span v-else class="badge badge-secondary">{{ $t('myRequests.notPublished') }}</span>
            </td>
            <td class="actions-cell">
              <button type="button" class="btn btn-sm btn-outline" @click="openEditModal(r)">{{ $t('coordinator.edit') }}</button>
              <template v-if="r.isPublished">
                <button type="button" class="btn btn-sm btn-secondary" @click="unpublishRequest(r.id)">{{
                  $t('coordinator.unpublish')
                }}</button>
              </template>
              <template v-else>
                <button type="button" class="btn btn-sm btn-primary" @click="publishRequest(r.id)">{{
                  $t('coordinator.publish')
                }}</button>
              </template>
              <button type="button" class="btn btn-sm btn-outline" @click="openAssignModal(r)">{{ $t('coordinator.assign') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="text-muted">{{ $t('dashboard.loadingShort') }}</p>
      <p v-else-if="!requests.length" class="text-muted">{{ $t('coordinator.noRequests') }}</p>
    </div>

    <!-- Assign modal -->
    <div v-if="assignModalRequest" class="modal" @click.self="assignModalRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ $t('coordinator.assignTitle', { id: assignModalRequest.id }) }}</h2>
          <button type="button" class="modal-close" :aria-label="$t('common.close')" @click="assignModalRequest = null">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="volunteer-search mb-3">
            <input
              v-model="volunteerSearch"
              type="text"
              class="form-control"
              :placeholder="$t('coordinator.volunteerSearchPh')"
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
                {{ $t('coordinator.assignBtn') }}
              </button>
            </li>
          </ul>
          <p v-if="volunteersLoading" class="text-muted">{{ $t('coordinator.loadingVolunteers') }}</p>
          <p v-else-if="!volunteerList.length" class="text-muted">{{ $t('coordinator.noVolunteers') }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="assignModalRequest = null">{{ $t('common.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Edit request modal -->
    <div v-if="editModalRequest" class="modal" @click.self="editModalRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content modal-content-wide">
        <div class="modal-header">
          <h2>{{ $t('coordinator.editTitle', { id: editModalRequest.id }) }}</h2>
          <button type="button" class="modal-close" :aria-label="$t('common.close')" @click="editModalRequest = null">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="editError" class="auth-message auth-message-error">{{ editError }}</div>
          <form class="edit-request-form" @submit.prevent="submitEditRequest">
            <div class="form-group">
              <label for="edit-title">{{ $t('coordinator.labelTitle') }}</label>
              <input id="edit-title" v-model="editForm.title" type="text" class="form-control" required minlength="5" maxlength="200" />
            </div>
            <div class="form-group">
              <label for="edit-description">{{ $t('coordinator.labelDesc') }}</label>
              <textarea id="edit-description" v-model="editForm.description" class="form-control" rows="4" required minlength="50"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-priority">{{ $t('createRequest.priorityLabel') }}</label>
                <select id="edit-priority" v-model="editForm.priority" class="form-control">
                  <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ priorityLabels[p] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-problemType">{{ $t('map.helpType') }}</label>
                <select id="edit-problemType" v-model="editForm.problemType" class="form-control">
                  <option v-for="pt in ALLOWED_PROBLEM_TYPES" :key="pt" :value="pt">{{ problemTypeLabels[pt] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-peopleCount">{{ $t('createRequest.peopleLabel') }}</label>
                <input id="edit-peopleCount" v-model.number="editForm.peopleCount" type="number" class="form-control" min="1" max="1000" />
              </div>
            </div>
            <div class="form-group">
              <label for="edit-address">{{ $t('createRequest.addressLabel') }}</label>
              <input id="edit-address" v-model="editForm.address" type="text" class="form-control" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-district">{{ $t('createRequest.districtLabel') }}</label>
                <select id="edit-district" v-model="editForm.district" class="form-control">
                  <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ districtLabels[d] }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-landmark">{{ $t('coordinator.landmark') }}</label>
                <input id="edit-landmark" v-model="editForm.landmark" type="text" class="form-control" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-contactName">{{ $t('coordinator.contactPerson') }}</label>
                <input id="edit-contactName" v-model="editForm.contactName" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label for="edit-contactPhone">{{ $t('auth.phone') }}</label>
                <input id="edit-contactPhone" v-model="editForm.contactPhone" type="tel" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label for="edit-additionalInfo">{{ $t('coordinator.additionalInfo') }}</label>
              <textarea id="edit-additionalInfo" v-model="editForm.additionalInfo" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="editModalRequest = null">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="editSaving">{{ $t('coordinator.save') }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
  STATUS_TRANSITIONS,
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_PRIORITIES,
  ALLOWED_DISTRICTS,
  ALLOWED_STATUSES,
} from '../constants/requests.js'
import { useEnumLabel } from '../composables/useEnumLabel.js'

const { t } = useI18n()
const lb = useEnumLabel()
const priorityLabels = computed(() =>
  Object.fromEntries(ALLOWED_PRIORITIES.map((c) => [c, lb.priority(c)]))
)
const districtLabels = computed(() =>
  Object.fromEntries(ALLOWED_DISTRICTS.map((c) => [c, lb.district(c)]))
)
const problemTypeLabels = computed(() =>
  Object.fromEntries(ALLOWED_PROBLEM_TYPES.map((c) => [c, lb.problemType(c)]))
)
const requestStatusLabels = computed(() =>
  Object.fromEntries(ALLOWED_STATUSES.map((c) => [c, lb.requestStatus(c)]))
)

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
    alert(e.message || t('coordinator.publishError'))
  }
}

async function unpublishRequest(id) {
  try {
    await withLoading(() => apiUnpublishRequest(id))
    loadRequests()
  } catch (e) {
    alert(e.message || t('coordinator.unpublishError'))
  }
}

async function patchRequestStatus(id, status) {
  try {
    await withLoading(() => apiPatchRequestStatus(id, status))
    loadRequests()
  } catch (e) {
    alert(e.message || t('coordinator.statusError'))
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

const editModalRequest = ref(null)
const editForm = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM',
  problemType: 'MEDICAL',
  peopleCount: 1,
  address: '',
  district: 'ALMALYNSKIY',
  landmark: '',
  contactName: '',
  contactPhone: '',
  additionalInfo: '',
})
const editSaving = ref(false)
const editError = ref('')

async function openEditModal(request) {
  editModalRequest.value = request
  editError.value = ''
  editForm.title = request.title ?? ''
  editForm.description = request.description ?? ''
  editForm.priority = request.priority ?? 'MEDIUM'
  editForm.problemType = request.problemType ?? 'MEDICAL'
  editForm.peopleCount = request.peopleCount ?? 1
  editForm.address = request.address ?? ''
  editForm.district = request.district ?? 'ALMALYNSKIY'
  editForm.landmark = request.landmark ?? ''
  editForm.contactName = request.contactName ?? ''
  editForm.contactPhone = request.contactPhone ?? ''
  editForm.additionalInfo = request.additionalInfo ?? ''
  try {
    const full = await getRequest(request.id)
    editModalRequest.value = full
    editForm.title = full.title ?? ''
    editForm.description = full.description ?? ''
    editForm.priority = full.priority ?? 'MEDIUM'
    editForm.problemType = full.problemType ?? 'MEDICAL'
    editForm.peopleCount = full.peopleCount ?? 1
    editForm.address = full.address ?? ''
    editForm.district = full.district ?? 'ALMALYNSKIY'
    editForm.landmark = full.landmark ?? ''
    editForm.contactName = full.contactName ?? ''
    editForm.contactPhone = full.contactPhone ?? ''
    editForm.additionalInfo = full.additionalInfo ?? ''
  } catch (e) {
    editError.value = e.message || t('coordinator.loadEditError')
  }
}

async function submitEditRequest() {
  if (!editModalRequest.value) return
  editError.value = ''
  editSaving.value = true
  try {
    await withLoading(() =>
      updateRequest(editModalRequest.value.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        problemType: editForm.problemType,
        peopleCount: editForm.peopleCount || 1,
        address: editForm.address.trim(),
        district: editForm.district,
        landmark: editForm.landmark.trim() || undefined,
        contactName: editForm.contactName.trim(),
        contactPhone: editForm.contactPhone.trim(),
        additionalInfo: editForm.additionalInfo.trim() || undefined,
      })
    )
    editModalRequest.value = null
    loadRequests()
  } catch (e) {
    editError.value = e.message || t('coordinator.saveEditError')
  } finally {
    editSaving.value = false
  }
}

async function assignVolunteer(requestId, volunteerId) {
  assigningId.value = volunteerId
  try {
    await withLoading(() => apiAssignVolunteer(requestId, volunteerId))
    assignModalRequest.value = null
    loadRequests()
  } catch (e) {
    alert(e.message || t('coordinator.assignError'))
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
.modal-content-wide { max-width: 560px; }
.edit-request-form .form-group { margin-bottom: 1rem; }
.edit-request-form .form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
.edit-request-form .form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>
