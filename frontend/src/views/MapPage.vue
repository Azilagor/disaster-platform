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

        <!-- Виджет погоды поверх карты -->
        <div class="map-weather-widget" v-if="weather">
          <img v-if="weather.icon" :src="weather.icon" :alt="weather.description" class="mw-icon" />
          <div class="mw-body">
            <div class="mw-temp">{{ weather.temp }}°C</div>
            <div class="mw-desc">{{ weather.description }}</div>
            <div class="mw-details">
              <span>💨 {{ weather.windSpeed }} м/с</span>
              <span>💧 {{ weather.humidity }}%</span>
            </div>
          </div>
        </div>
        <div v-else-if="weatherLoading" class="map-weather-widget map-weather-widget--loading">
          <div class="mw-skeleton"></div>
        </div>

        <!-- Легенда -->
        <div class="map-legend">
          <h4>Приоритет</h4>
          <div class="legend-items">
            <div class="legend-item"><span class="legend-marker critical-marker"></span><span>Критический</span></div>
            <div class="legend-item"><span class="legend-marker high-marker"></span><span>Высокий</span></div>
            <div class="legend-item"><span class="legend-marker medium-marker"></span><span>Средний</span></div>
            <div class="legend-item"><span class="legend-marker low-marker"></span><span>Низкий</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Панель фильтров -->
    <aside class="filters-drawer" :class="{ 'filters-drawer--open': panelOpen }">
      <div class="filters-drawer-inner">
        <div class="filters-header">
          <h2>Фильтры</h2>
          <button type="button" class="filters-close" @click="panelOpen = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
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
            <strong>{{ filteredBySearch.length }}</strong>
            <span>запросов на карте</span>
          </div>
        </div>
        <div class="request-list-sidebar">
          <div
            v-for="r in filteredBySearch"
            :key="r.id"
            class="request-list-item"
            :class="{ active: selectedRequest && selectedRequest.id === r.id }"
            @click="selectedRequest = r; panelOpen = false"
          >
            <span class="priority-dot" :class="(r.priority || '').toLowerCase()"></span>
            <div class="request-list-body">
              <span class="request-list-title">{{ r.title }}</span>
              <span class="request-list-address">{{ r.address }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Детальная карточка заявки -->
    <div v-if="selectedRequest" class="modal" @click.self="selectedRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="modal-id">#{{ selectedRequest.id }}</span>
            <span class="priority-badge" :class="(selectedRequest.priority || '').toLowerCase()">
              {{ PRIORITY_LABELS[selectedRequest.priority] || selectedRequest.priority }}
            </span>
          </div>
          <button type="button" class="modal-close" @click="selectedRequest = null">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 2L2 18M2 2l16 16" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Тип и заголовок -->
          <div class="mc-type">{{ PROBLEM_TYPE_LABELS[selectedRequest.problemType] || selectedRequest.problemType }}</div>
          <h3 class="mc-title">{{ selectedRequest.title }}</h3>

          <!-- Инфо-сетка -->
          <div class="mc-info-grid">
            <div class="mc-info-item">
              <span class="mc-info-label">📍 Адрес</span>
              <span class="mc-info-value">{{ selectedRequest.address }}</span>
            </div>
            <div v-if="selectedRequest.landmark" class="mc-info-item">
              <span class="mc-info-label">🗺 Ориентир</span>
              <span class="mc-info-value">{{ selectedRequest.landmark }}</span>
            </div>
            <div class="mc-info-item">
              <span class="mc-info-label">🏙 Район</span>
              <span class="mc-info-value">{{ DISTRICT_LABELS[selectedRequest.district] || selectedRequest.district }}</span>
            </div>
            <div v-if="selectedRequest.peopleCount" class="mc-info-item">
              <span class="mc-info-label">👥 Нуждающихся</span>
              <span class="mc-info-value">{{ selectedRequest.peopleCount }} чел.</span>
            </div>
            <div v-if="selectedRequest.contactPhone" class="mc-info-item">
              <span class="mc-info-label">📞 Контакт</span>
              <a :href="'tel:' + selectedRequest.contactPhone" class="mc-info-value mc-phone">
                {{ selectedRequest.contactPhone }}
              </a>
            </div>
            <div v-if="selectedRequest._count?.volunteers !== undefined" class="mc-info-item">
              <span class="mc-info-label">🙋 Волонтёров</span>
              <span class="mc-info-value">{{ selectedRequest._count.volunteers }}</span>
            </div>
          </div>

          <!-- Погода в районе заявки -->
          <div v-if="weather" class="mc-weather">
            <div class="mc-weather-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              Погода сейчас — {{ weather.city }}
            </div>
            <div class="mc-weather-body">
              <img v-if="weather.icon" :src="weather.icon" :alt="weather.description" class="mc-weather-icon" />
              <div>
                <div class="mc-weather-temp">{{ weather.temp }}°C <span class="mc-weather-feels">ощущается {{ weather.feelsLike }}°C</span></div>
                <div class="mc-weather-desc">{{ weather.description }} · 💨 {{ weather.windSpeed }} м/с · 💧 {{ weather.humidity }}%</div>
              </div>
            </div>
          </div>

          <!-- Статус публикации -->
          <div class="mc-pub-status">
            <span v-if="selectedRequest.isPublished" class="badge badge-success">Опубликована</span>
            <span v-else class="badge badge-secondary">Не опубликована</span>
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
            {{ respondingId === selectedRequest.id ? '...' : '✅ Откликнуться' }}
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
import { API_BASE_URL } from '../api/config.js'
import {
  ALLOWED_DISTRICTS, ALLOWED_PRIORITIES, ALLOWED_PROBLEM_TYPES,
  DISTRICT_LABELS, PRIORITY_LABELS, PROBLEM_TYPE_LABELS,
} from '../constants/requests.js'
import 'leaflet/dist/leaflet.css'

const route     = useRoute()
const authStore = useAuthStore()
const role      = computed(() => (authStore.user?.role || '').toUpperCase())
const isVolunteer       = computed(() => role.value === 'VOLUNTEER')
const canCreateRequest  = computed(() => ['USER','COORDINATOR','ADMIN'].includes(role.value))
const canOpenFullDetail = computed(() => ['VOLUNTEER','COORDINATOR','ADMIN'].includes(role.value))

const panelOpen      = ref(false)
const searchQuery    = ref('')
const requests       = ref([])
const selectedRequest = ref(null)
const respondingId   = ref(null)
const mapRef         = ref(null)

let map          = null
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

// ── Погода ─────────────────────────────────────────────────────
const weather        = ref(null)
const weatherLoading = ref(true)

async function fetchWeather() {
  try {
    const res = await fetch(`${API_BASE_URL}/weather`)
    if (res.ok) weather.value = await res.json()
  } catch { /* молча */ }
  finally { weatherLoading.value = false }
}

// ── Заявки ─────────────────────────────────────────────────────
async function loadMapRequests() {
  try {
    const params = {}
    if (filters.district)    params.district    = filters.district
    if (filters.priority)    params.priority    = filters.priority
    if (filters.problemType) params.problemType = filters.problemType
    const data = await withLoading(() => getRequestsMap(params))
    requests.value = data.items ?? []
  } catch {
    requests.value = []
  }
}

watch(() => [filters.district, filters.priority, filters.problemType], loadMapRequests, { immediate: true })

const filteredBySearch = computed(() => {
  const q = searchQuery.value?.toLowerCase().trim()
  if (!q) return requests.value
  return requests.value.filter(r =>
    (r.title && r.title.toLowerCase().includes(q)) ||
    (r.address && r.address.toLowerCase().includes(q))
  )
})

// ── Карта ──────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MEDIUM:   '#d97706',
  LOW:      '#059669',
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function makePinIcon(color) {
  return `<svg width="32" height="36" viewBox="0 0 24 36">
    <defs><filter id="ps" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter></defs>
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#ps)"/>
    <circle cx="12" cy="12" r="4.5" fill="#fff" fill-opacity="0.9"/>
  </svg>`
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

  const withCoords = requests.value.filter(r =>
    r.latitude != null && r.longitude != null &&
    !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude))
  )

  withCoords.forEach(r => {
    const color = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.MEDIUM
    const icon  = L.divIcon({
      className: 'request-marker request-marker--pin',
      html:      makePinIcon(color),
      iconSize:  [32, 36],
      iconAnchor:[16, 36],
    })
    const marker = L.marker([Number(r.latitude), Number(r.longitude)], { icon })

    // Тултип: название + приоритет
    const tooltipHtml =
      `<div class="map-tooltip">` +
      `<strong>${escapeHtml(r.title)}</strong>` +
      `<span class="map-tooltip-priority map-tooltip-priority--${(r.priority||'').toLowerCase()}">${escapeHtml(PRIORITY_LABELS[r.priority] || r.priority)}</span>` +
      `</div>`

    marker.bindTooltip(tooltipHtml, {
      direction: 'top', permanent: false, offset: [0, -36],
      className: 'map-marker-tooltip-rich',
    })

    if (canOpenFullDetail.value) {
      marker.on('click', () => { selectedRequest.value = r })
    } else {
      const popup =
        `<div class="map-marker-popup">` +
        `<strong>${escapeHtml(r.title)}</strong>` +
        (r.address ? `<br><span class="map-marker-popup-address">${escapeHtml(r.address)}</span>` : '') +
        `</div>`
      marker.bindPopup(popup, { className: 'map-marker-popup-container', maxWidth: 280 })
    }

    markersLayer.addLayer(marker)
  })
}

onMounted(async () => {
  fetchWeather()
  await nextTick()
  if (mapRef.value) {
    const L = (await import('leaflet')).default
    window.L = L
    map = L.map(mapRef.value).setView([43.238949, 76.945465], 12)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd', maxZoom: 20,
    }).addTo(map)
    markersLayer = L.layerGroup().addTo(map)
    updateMarkers()
    setTimeout(() => map?.invalidateSize(), 100)
  }

  const id = route.query.request
  if (id && requests.value.length) {
    const r = requests.value.find(req => String(req.id) === String(id))
    if (r) selectedRequest.value = r
  }
})

watch(requests, () => updateMarkers(), { deep: true })
watch(canOpenFullDetail, () => updateMarkers())
watch(requests, (list) => {
  const id = route.query.request
  if (id && list.length && !selectedRequest.value) {
    const r = list.find(req => String(req.id) === String(id))
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
.map-page { display: flex; flex-direction: column; min-height: 100vh; width: 100%; box-sizing: border-box; }
.map-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }

/* ── Хедер ─────────────────────────────────────────────────── */
.map-header { display: flex; gap: 0.5rem; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.search-box { flex: 1; }
.search-box input { width: 100%; }
.panel-toggle {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.75rem; background: #fff;
  border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,.06); cursor: pointer;
  font-size: 0.875rem; color: #374151; flex-shrink: 0;
}
.panel-toggle:hover { background: #f9fafb; }
.panel-toggle-label { white-space: nowrap; }

/* ── Зона карты ────────────────────────────────────────────── */
.map-area { position: relative; flex: 1; min-height: 300px; }
.map-wrapper { position: absolute; inset: 0; background: #e8e8e8; }
.map-wrapper :deep(.request-marker) { background: none !important; border: none !important; }

/* ── Погода на карте ───────────────────────────────────────── */
.map-weather-widget {
  position: absolute;
  top: 12px; right: 12px;
  z-index: 400;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 160px;
}
.map-weather-widget--loading { min-height: 56px; }
.mw-skeleton {
  width: 100%; height: 36px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200%; animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.mw-icon { width: 40px; height: 40px; flex-shrink: 0; }
.mw-body { display: flex; flex-direction: column; gap: 1px; }
.mw-temp { font-size: 1.15rem; font-weight: 700; color: #1d4ed8; line-height: 1; }
.mw-desc { font-size: 0.72rem; color: #6b7280; text-transform: capitalize; }
.mw-details { display: flex; gap: 0.5rem; font-size: 0.7rem; color: #9ca3af; margin-top: 1px; }

/* ── Легенда ───────────────────────────────────────────────── */
.map-legend {
  position: absolute; right: 12px; bottom: 12px; z-index: 400;
  padding: 0.75rem 1rem; background: #fff; border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,.15); border: 1px solid #e5e7eb;
}
.map-legend h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
.legend-items { display: flex; flex-direction: column; gap: 0.35rem; }
.legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; }
.legend-marker { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.critical-marker { background: #dc2626; }
.high-marker { background: #ea580c; }
.medium-marker { background: #d97706; }
.low-marker { background: #059669; }

/* ── Тултип маркера ────────────────────────────────────────── */
.map-wrapper :deep(.map-marker-tooltip-rich) {
  background: #1f2937; color: #fff; border: none;
  border-radius: 8px; padding: 6px 10px;
  font-size: 0.82rem; box-shadow: 0 4px 12px rgba(0,0,0,.2);
}
.map-wrapper :deep(.map-marker-tooltip-rich::before) { border-top-color: #1f2937; }
.map-wrapper :deep(.map-tooltip) { display: flex; flex-direction: column; gap: 2px; max-width: 200px; }
.map-wrapper :deep(.map-tooltip-priority) {
  font-size: 0.72rem; font-weight: 600;
  padding: 1px 6px; border-radius: 10px; align-self: flex-start;
}
.map-wrapper :deep(.map-tooltip-priority--critical) { background: #fee2e2; color: #991b1b; }
.map-wrapper :deep(.map-tooltip-priority--high)     { background: #ffedd5; color: #9a3412; }
.map-wrapper :deep(.map-tooltip-priority--medium)   { background: #fef9c3; color: #854d0e; }
.map-wrapper :deep(.map-tooltip-priority--low)      { background: #dcfce7; color: #166534; }

/* ── Боковая панель фильтров ───────────────────────────────── */
.filters-drawer {
  position: fixed; left: 0; top: 0; bottom: 0; width: 300px; max-width: 90vw;
  z-index: 500; transform: translateX(-100%);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  pointer-events: none;
}
.filters-drawer--open { transform: translateX(0); pointer-events: auto; box-shadow: 4px 0 20px rgba(0,0,0,.15); }
.filters-drawer-inner { height: 100%; background: #fff; padding: 1rem; overflow-y: auto; border-right: 1px solid #e5e7eb; }
.filters-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.filters-header h2 { margin: 0; font-size: 1.1rem; }
.filters-close { padding: 0.35rem; background: none; border: none; border-radius: 6px; cursor: pointer; color: #6b7280; }
.filters-close:hover { background: #f3f4f6; }
.filter-group { margin-bottom: 1rem; }
.filter-label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.25rem; }
.filter-stats { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.9rem; }
.request-list-sidebar { margin-top: 1rem; }
.request-list-item { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem 0.25rem; border-bottom: 1px solid #f0f0f0; cursor: pointer; border-radius: 6px; }
.request-list-item:hover { background: #f8f8f8; }
.request-list-item.active { background: #e8f0fe; }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.priority-dot.critical, .priority-dot.high { background: #dc2626; }
.priority-dot.medium { background: #d97706; }
.priority-dot.low { background: #059669; }
.request-list-body { display: flex; flex-direction: column; gap: 2px; }
.request-list-title { font-weight: 500; font-size: 0.9rem; color: #1f2937; }
.request-list-address { font-size: 0.78rem; color: #6b7280; }

/* ── Модалка детальной карточки ────────────────────────────── */
.modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
.modal-content {
  position: relative; background: #fff; border-radius: 14px;
  max-width: 460px; width: 90%; max-height: 90vh; overflow: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6;
}
.modal-header-left { display: flex; align-items: center; gap: 0.5rem; }
.modal-id { font-size: 0.82rem; color: #9ca3af; font-weight: 600; }
.modal-close { background: none; border: none; cursor: pointer; color: #6b7280; padding: 0.2rem; border-radius: 6px; }
.modal-close:hover { background: #f3f4f6; color: #111; }

.modal-body { padding: 1.25rem; }

.mc-type { font-size: 0.78rem; color: #6b7280; margin-bottom: 0.25rem; }
.mc-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0 0 1rem; line-height: 1.35; }

/* Инфо-сетка */
.mc-info-grid { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.mc-info-item { display: flex; flex-direction: column; gap: 2px; }
.mc-info-label { font-size: 0.75rem; color: #9ca3af; }
.mc-info-value { font-size: 0.9rem; color: #1f2937; }
.mc-phone { color: #2563eb; text-decoration: none; }
.mc-phone:hover { text-decoration: underline; }

/* Погода в карточке */
.mc-weather {
  background: #f0f7ff; border-radius: 10px; padding: 0.75rem 1rem;
  margin-bottom: 0.75rem; border: 1px solid #bfdbfe;
}
.mc-weather-header {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.75rem; font-weight: 600; color: #1d4ed8; margin-bottom: 0.5rem;
}
.mc-weather-body { display: flex; align-items: center; gap: 0.5rem; }
.mc-weather-icon { width: 36px; height: 36px; }
.mc-weather-temp { font-size: 1rem; font-weight: 700; color: #1d4ed8; }
.mc-weather-feels { font-size: 0.78rem; font-weight: 400; color: #6b7280; }
.mc-weather-desc { font-size: 0.78rem; color: #6b7280; margin-top: 1px; }

.mc-pub-status { margin-top: 0.5rem; }

.modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 1rem 1.25rem; border-top: 1px solid #f3f4f6; }

/* Приоритет бэджи */
.priority-badge { display: inline-block; font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 20px; font-weight: 600; }
.priority-badge.critical { background: #fee2e2; color: #991b1b; }
.priority-badge.high     { background: #ffedd5; color: #9a3412; }
.priority-badge.medium   { background: #fef9c3; color: #854d0e; }
.priority-badge.low      { background: #dcfce7; color: #166534; }

.badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.badge-success { background: #d4edda; color: #155724; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
</style>