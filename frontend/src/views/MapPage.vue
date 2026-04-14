<template>
  <div class="map-page">
    <div class="map-container">
      <div class="map-header">
        <button
          type="button"
          class="panel-toggle"
          :aria-label="panelOpen ? 'Скрыть фильтры' : 'Показать фильтры'"
          @click="panelOpen = !panelOpen"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="panelOpen" d="M15 18l-6-6 6-6" />
            <path v-else d="M9 18l6-6-6-6" />
          </svg>
          <span class="panel-toggle-label">{{ panelOpen ? 'Скрыть фильтры' : 'Фильтры' }}</span>
        </button>
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="Поиск по адресу или описанию..." class="form-control" />
        </div>
        <router-link v-if="canCreateRequest" to="/create-request" class="btn btn-primary">Создать запрос</router-link>
      </div>
      <div class="map-area">
        <div ref="mapRef" class="map-wrapper"></div>
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
    </div>

    <aside class="filters-drawer" :class="{ 'filters-drawer--open': panelOpen }" aria-hidden="!panelOpen">
      <div class="filters-drawer-inner">
        <div class="filters-header">
          <h2>Фильтры</h2>
          <button type="button" class="filters-close" aria-label="Закрыть" @click="panelOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      <div class="filter-group">
        <span class="filter-label">Показать</span>
        <select v-model="filters.scope" class="form-control">
          <option value="all">Все заявки</option>
          <option value="mine">Мои заявки</option>
        </select>
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
      </div>
    </aside>

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
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { getRequestsMap, getMyRequests, volunteerRespond } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'
import {
  ALLOWED_DISTRICTS,
  ALLOWED_PRIORITIES,
  ALLOWED_PROBLEM_TYPES,
  DISTRICT_CENTROIDS,
  DISTRICT_LABELS,
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
} from '../constants/requests.js'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const authStore = useAuthStore()
const role = computed(() => (authStore.user?.role || '').toUpperCase())
const isVolunteer = computed(() => role.value === 'VOLUNTEER')
const canCreateRequest = computed(() => role.value === 'USER' || role.value === 'COORDINATOR' || role.value === 'ADMIN')
/** Full map interactivity: open detail modal and (for volunteer) respond. USER only sees points with title. */
const canOpenFullDetail = computed(
  () => role.value === 'VOLUNTEER' || role.value === 'COORDINATOR' || role.value === 'ADMIN'
)

const panelOpen = ref(false)
const searchQuery = ref('')
const requests = ref([])
const loading = ref(false)
const selectedRequest = ref(null)
const respondingId = ref(null)
const mapRef = ref(null)

let map = null
let markersLayer = null

const filters = reactive({ scope: 'all', district: '', priority: '', problemType: '' })

const ACTIVE_STATUSES = new Set(['NEW', 'IN_PROGRESS'])
const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function matchesMapFilters(r) {
  if (filters.district && r.district !== filters.district) return false
  if (filters.priority && r.priority !== filters.priority) return false
  if (filters.problemType && r.problemType !== filters.problemType) return false
  return true
}

/** Строка из GET /requests/my приводим к тому же виду, что у точек с /requests/map */
function rowForMap(r) {
  return {
    id: r.id,
    title: r.title,
    problemType: r.problemType,
    priority: r.priority,
    status: r.status,
    address: r.address,
    district: r.district,
    landmark: r.landmark ?? null,
    peopleCount: r.peopleCount,
    contactPhone: r.contactPhone ?? undefined,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    isPublished: r.isPublished,
    createdAt: r.createdAt,
    _count: { volunteers: Array.isArray(r.volunteers) ? r.volunteers.length : r._count?.volunteers ?? 0 },
  }
}

function sortMapItems(items) {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 2
    const pb = PRIORITY_RANK[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    const ta = new Date(a.createdAt || 0).getTime()
    const tb = new Date(b.createdAt || 0).getTime()
    return tb - ta
  })
}

async function loadMapRequests() {
  loading.value = true
  try {
    const params = {}
    if (filters.district) params.district = filters.district
    if (filters.priority) params.priority = filters.priority
    if (filters.problemType) params.problemType = filters.problemType

    const items = await withLoading(async () => {
      if (filters.scope === 'mine') {
        const mine = await getMyRequests({ limit: 100 })
        return sortMapItems(
          mine
            .filter((r) => ACTIVE_STATUSES.has(r.status))
            .filter(matchesMapFilters)
            .map(rowForMap)
        )
      }

      const [mapData, mineList] = await Promise.all([
        getRequestsMap(params),
        getMyRequests({ limit: 100 }).catch(() => []),
      ])

      let merged = [...(mapData.items ?? [])]
      const seen = new Set(merged.map((r) => r.id))
      const mineRows = (mineList || [])
        .filter((r) => ACTIVE_STATUSES.has(r.status))
        .filter(matchesMapFilters)
        .map(rowForMap)

      for (const r of mineRows) {
        if (!seen.has(r.id)) {
          merged.push(r)
          seen.add(r.id)
        }
      }
      return sortMapItems(merged)
    })

    requests.value = items
  } catch (e) {
    requests.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.scope, filters.district, filters.priority, filters.problemType],
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

const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#059669',
}

function escapeHtml(text) {
  if (text == null || text === '') return ''
  const s = String(text)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** SVG маркер-булавка (как в примере), цвет по приоритету */
function makePinIcon(color) {
  return `
    <svg width="32" height="36" viewBox="0 0 24 36" class="map-pin-svg">
      <defs>
        <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="2" filter="url(#pin-shadow)"/>
      <circle cx="12" cy="12" r="4" fill="#fff" fill-opacity="0.9"/>
    </svg>
  `
}

/** Координаты маркера: из заявки или центр района (если геокод не задан). */
function markerLatLng(r) {
  const lat = r.latitude != null ? Number(r.latitude) : NaN
  const lng = r.longitude != null ? Number(r.longitude) : NaN
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng]
  const c = r.district && DISTRICT_CENTROIDS[r.district]
  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') return [c.lat, c.lng]
  return null
}

function updateMarkers() {
  if (!map || !markersLayer) return
  markersLayer.clearLayers()
  const L = window.L
  if (!L) return
  const list = requests.value
  const withCoords = list.map((r) => ({ r, pos: markerLatLng(r) })).filter((x) => x.pos != null)
  const fullDetail = canOpenFullDetail.value
  withCoords.forEach(({ r, pos }) => {
    const lat = pos[0]
    const lon = pos[1]
    const color = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.MEDIUM
    const icon = L.divIcon({
      className: 'request-marker request-marker--pin',
      html: makePinIcon(color),
      iconSize: [32, 36],
      iconAnchor: [16, 36],
    })
    const marker = L.marker([lat, lon], { icon })
    marker.request = r
    marker.bindTooltip(escapeHtml(r.title || 'Запрос'), {
      direction: 'top',
      permanent: false,
      offset: [0, -36],
      className: 'map-marker-tooltip',
    })
    if (fullDetail) {
      marker.on('click', () => { selectedRequest.value = r })
    } else {
      const popupContent =
        '<div class="map-marker-popup">' +
        '<strong>' + escapeHtml(r.title || 'Запрос') + '</strong>' +
        (r.address ? '<br><span class="map-marker-popup-address">' + escapeHtml(r.address) + '</span>' : '') +
        '</div>'
      marker.bindPopup(popupContent, { className: 'map-marker-popup-container', maxWidth: 280 })
    }
    markersLayer.addLayer(marker)
  })
}

onMounted(async () => {
  await nextTick()
  if (mapRef.value) {
    const L = (await import('leaflet')).default
    window.L = L
    map = L.map(mapRef.value).setView([43.238949, 76.945465], 12)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)
    markersLayer = L.layerGroup().addTo(map)
    updateMarkers()
    setTimeout(() => { map?.invalidateSize() }, 100)
  }
  const id = route.query.request
  if (id && requests.value.length) {
    const r = requests.value.find((req) => String(req.id) === String(id))
    if (r) selectedRequest.value = r
  }
})

watch(requests, () => updateMarkers(), { deep: true })
watch(canOpenFullDetail, () => updateMarkers())

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
.map-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}
.map-container { flex: 1; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.panel-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  flex-shrink: 0;
}
.panel-toggle:hover { background: #f9fafb; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
.panel-toggle .panel-toggle-label { white-space: nowrap; }
.filters-drawer {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  max-width: 90vw;
  z-index: 500;
  transform: translateX(-100%);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  pointer-events: none;
}
.filters-drawer--open {
  transform: translateX(0);
  pointer-events: auto;
  box-shadow: 4px 0 20px rgba(0,0,0,0.15);
}
.filters-drawer-inner {
  height: 100%;
  background: #fff;
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
}
.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.filters-header h2 { margin: 0; font-size: 1.1rem; }
.filters-close {
  padding: 0.35rem;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
}
.filters-close:hover { background: #f3f4f6; color: #111; }
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
.map-header { display: flex; gap: 0.5rem; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.search-box { flex: 1; }
.search-box input { width: 100%; }
.map-area { position: relative; flex: 1; min-height: 300px; }
.map-wrapper { position: absolute; inset: 0; width: 100%; height: 100%; background: #e8e8e8; }
.map-wrapper :deep(.request-marker) { background: none !important; border: none !important; }
.map-wrapper :deep(.request-marker--pin .map-pin-svg) { display: block; pointer-events: none; }
.map-wrapper :deep(.leaflet-popup-tip) { background: #fff; }
.map-wrapper :deep(.map-marker-tooltip) { font-size: 0.85rem; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.map-wrapper :deep(.map-marker-popup-container .leaflet-popup-content-wrapper) { border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.map-wrapper :deep(.map-marker-popup) { margin: 0; font-size: 0.9rem; }
.map-wrapper :deep(.map-marker-popup-address) { color: #666; font-size: 0.85rem; }
.map-wrapper :deep(.map-marker-popup-detail) { color: #888; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
.map-legend {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 400;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  border: 1px solid #e5e7eb;
}
.map-legend h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
.legend-items { display: flex; flex-direction: column; gap: 0.35rem; }
.legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; }
.legend-marker { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
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
