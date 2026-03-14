<template>
  <div class="map-page">
    <aside class="filters-panel">
      <div class="filters-header">
        <h2>Фильтры</h2>
      </div>
      <div class="filter-group">
        <span class="filter-label">Район</span>
        <select v-model="filters.district" class="form-control">
          <option value="">Все районы</option>
          <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ DISTRICT_LABELS[d] }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Приоритет</span>
        <select v-model="filters.priority" class="form-control">
          <option value="">Все приоритеты</option>
          <option v-for="p in ALLOWED_PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">Тип помощи</span>
        <select v-model="filters.problemType" class="form-control">
          <option value="">Все типы</option>
          <option v-for="t in ALLOWED_PROBLEM_TYPES" :key="t" :value="t">{{ PROBLEM_TYPE_LABELS[t] }}</option>
        </select>
      </div>
      <div class="filter-stats">
        <div class="filter-stat-item">
          <strong>{{ requests.length }}</strong>
          <span>запросов на карте</span>
        </div>
      </div>
      <div class="request-list-sidebar">
        <div
          v-for="r in filteredBySearch"
          :key="r.id"
          class="request-list-item"
          :class="{ active: selectedRequest && selectedRequest.id === r.id }"
          @click="selectedRequest = r"
        >
          <span class="priority-dot" :class="(r.priority || '').toLowerCase()"></span>
          <span class="request-list-title">{{ r.title }}</span>
          <span class="request-list-address">{{ r.address }}</span>
        </div>
      </div>
    </aside>

    <div class="map-container">
      <div class="map-header">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="Поиск по адресу или описанию..." class="form-control" />
        </div>
        <router-link v-if="canCreateRequest" to="/create-request" class="btn btn-primary">Создать запрос</router-link>
      </div>
      <div class="map-placeholder">
        <div class="map-overlay">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>Карта запросов</p>
          <p class="map-note">
            Маркеры загружены из API ({{ requests.length }}). Список заявок — в панели слева. Подключите карту (Leaflet, Yandex.Maps) для отображения точек по координатам.
          </p>
        </div>
      </div>
      <div class="map-legend">
        <h4>Приоритет</h4>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-marker critical-marker"></span><span>Критический</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker high-marker"></span><span>Высокий</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker medium-marker"></span><span>Средний</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker low-marker"></span><span>Низкий</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: request detail -->
    <div v-if="selectedRequest" class="modal" @click.self="selectedRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Запрос #{{ selectedRequest.id }}</h2>
          <button type="button" class="modal-close" aria-label="Закрыть" @click="selectedRequest = null">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 2L2 18M2 2l16 16" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="request-detail-header">
            <span class="priority-badge" :class="(selectedRequest.priority || '').toLowerCase()">
              {{ PRIORITY_LABELS[selectedRequest.priority] || selectedRequest.priority }}
            </span>
            <span class="problem-type">{{ PROBLEM_TYPE_LABELS[selectedRequest.problemType] || selectedRequest.problemType }}</span>
          </div>
          <h3>{{ selectedRequest.title }}</h3>
          <div class="detail-section">
            <h4>Адрес</h4>
            <p>{{ selectedRequest.address }}</p>
          </div>
          <div class="detail-section" v-if="selectedRequest.peopleCount">
            <h4>Количество людей</h4>
            <p>{{ selectedRequest.peopleCount }}</p>
          </div>
          <div class="detail-section" v-if="selectedRequest.contactPhone">
            <h4>Контакт</h4>
            <p>{{ selectedRequest.contactPhone }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="selectedRequest = null">Закрыть</button>
          <button
            v-if="isVolunteer"
            type="button"
            class="btn btn-primary"
            :disabled="respondingId === selectedRequest.id"
            @click="respondFromMap(selectedRequest.id)"
          >
            {{ respondingId === selectedRequest.id ? '...' : 'Откликнуться' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getRequestsMap, volunteerRespond } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'
import {
  ALLOWED_DISTRICTS,
  ALLOWED_PRIORITIES,
  ALLOWED_PROBLEM_TYPES,
  DISTRICT_LABELS,
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
} from '../constants/requests.js'

const route = useRoute()
const authStore = useAuthStore()
const role = computed(() => (authStore.user?.role || '').toUpperCase())
const isVolunteer = computed(() => role.value === 'VOLUNTEER')
const canCreateRequest = computed(() => role.value === 'USER' || role.value === 'COORDINATOR' || role.value === 'ADMIN')

const searchQuery = ref('')
const requests = ref([])
const loading = ref(false)
const selectedRequest = ref(null)
const respondingId = ref(null)

const filters = reactive({ district: '', priority: '', problemType: '' })

async function loadMapRequests() {
  loading.value = true
  try {
    const params = {}
    if (filters.district) params.district = filters.district
    if (filters.priority) params.priority = filters.priority
    if (filters.problemType) params.problemType = filters.problemType
    const data = await withLoading(() => getRequestsMap(params))
    requests.value = data.items ?? []
  } catch (e) {
    requests.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.district, filters.priority, filters.problemType],
  () => loadMapRequests(),
  { immediate: true }
)

const filteredBySearch = computed(() => {
  const q = searchQuery.value?.toLowerCase().trim()
  if (!q) return requests.value
  return requests.value.filter(
    (r) =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
  )
})

onMounted(() => {
  const id = route.query.request
  if (id && requests.value.length) {
    const r = requests.value.find((req) => String(req.id) === String(id))
    if (r) selectedRequest.value = r
  }
})
watch(requests, (list) => {
  const id = route.query.request
  if (id && list.length && !selectedRequest.value) {
    const r = list.find((req) => String(req.id) === String(id))
    if (r) selectedRequest.value = r
  }
})

async function respondFromMap(id) {
  respondingId.value = id
  try {
    await withLoading(() => volunteerRespond(id))
    selectedRequest.value = null
    loadMapRequests()
  } catch (e) {
    alert(e.message || 'Не удалось откликнуться')
  } finally {
    respondingId.value = null
  }
}
</script>

<style scoped>
.map-page { display: flex; min-height: 100%; }
.filters-panel { width: 280px; flex-shrink: 0; padding: 1rem; border-right: 1px solid #eee; overflow-y: auto; }
.filters-header { margin-bottom: 1rem; }
.filter-group { margin-bottom: 1rem; }
.filter-label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.25rem; }
.filter-stats { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; }
.filter-stat-item { font-size: 0.9rem; }
.request-list-sidebar { margin-top: 1rem; }
.request-list-item { padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.request-list-item:hover { background: #f8f8f8; }
.request-list-item.active { background: #e8f0fe; }
.priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.5rem; }
.priority-dot.critical, .priority-dot.high { background: #dc2626; }
.priority-dot.medium { background: #d97706; }
.priority-dot.low { background: #059669; }
.request-list-title { font-weight: 500; font-size: 0.95rem; }
.request-list-address { display: block; font-size: 0.8rem; color: #666; }
.map-container { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.map-header { display: flex; gap: 0.5rem; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.search-box { flex: 1; }
.search-box input { width: 100%; }
.map-placeholder { flex: 1; position: relative; background: #f5f5f5; }
.map-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; padding: 2rem; text-align: center; }
.map-note { font-size: 0.9rem; margin-top: 0.5rem; max-width: 360px; }
.map-legend { padding: 1rem; border-top: 1px solid #eee; }
.map-legend h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
.legend-items { display: flex; flex-wrap: wrap; gap: 1rem; }
.legend-item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; }
.legend-marker { width: 10px; height: 10px; border-radius: 50%; }
.critical-marker { background: #dc2626; }
.high-marker { background: #ea580c; }
.medium-marker { background: #d97706; }
.low-marker { background: #059669; }
.modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.modal-content { position: relative; background: #fff; border-radius: 8px; max-width: 440px; width: 90%; max-height: 90vh; overflow: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.modal-close { background: none; border: none; cursor: pointer; padding: 0.25rem; }
.modal-body { padding: 1rem; }
.request-detail-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.priority-badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.priority-badge.critical, .priority-badge.high { background: #fee2e2; color: #991b1b; }
.priority-badge.medium { background: #fef3c7; color: #92400e; }
.priority-badge.low { background: #d1fae5; color: #065f46; }
.detail-section { margin-top: 0.75rem; }
.detail-section h4 { margin: 0 0 0.25rem; font-size: 0.85rem; color: #666; }
.detail-section p { margin: 0; font-size: 0.95rem; }
.modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 1rem; border-top: 1px solid #eee; }
.problem-type { font-size: 0.85rem; color: #666; }
</style>
