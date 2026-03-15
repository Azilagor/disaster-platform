<template>
  <div class="map-picker">
    <div class="map-picker__header">
      <span class="map-picker__label">Отметьте точку на карте</span>
      <button
        v-if="modelValue.lat && modelValue.lng"
        type="button"
        class="map-picker__clear"
        @click="clearPin"
      >
        Сбросить точку
      </button>
    </div>

    <div class="map-picker__hint">
      {{ modelValue.lat && modelValue.lng
        ? `📍 ${modelValue.lat.toFixed(5)}, ${modelValue.lng.toFixed(5)}`
        : 'Кликните по карте чтобы указать местоположение' }}
    </div>

    <div ref="mapEl" class="map-picker__map"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import 'leaflet/dist/leaflet.css'

// Центр Алматы по умолчанию
const ALMATY_CENTER = [43.238949, 76.945465]
const DEFAULT_ZOOM  = 12

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ lat: null, lng: null }),
  },
})

const emit = defineEmits(['update:modelValue'])

const mapEl  = ref(null)
let map      = null
let marker   = null
let L        = null

// ── Инициализация карты ────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return

  L = (await import('leaflet')).default

  map = L.map(mapEl.value, { zoomControl: true }).setView(ALMATY_CENTER, DEFAULT_ZOOM)

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }
  ).addTo(map)

  // Восстановить маркер если координаты уже есть
  if (props.modelValue?.lat && props.modelValue?.lng) {
    placeMarker(props.modelValue.lat, props.modelValue.lng)
    map.setView([props.modelValue.lat, props.modelValue.lng], 15)
  }

  map.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng)
  })

  // Нужно чуть подождать пока DOM устаканится
  setTimeout(() => map?.invalidateSize(), 150)
})

onUnmounted(() => {
  map?.remove()
  map = null
})

// ── Логика маркера ─────────────────────────────────────────────
function placeMarker(lat, lng) {
  if (!L || !map) return

  if (!marker) {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      emit('update:modelValue', { lat: pos.lat, lng: pos.lng })
    })
  } else {
    marker.setLatLng([lat, lng])
  }

  emit('update:modelValue', { lat, lng })
}

function clearPin() {
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
  emit('update:modelValue', { lat: null, lng: null })
}

// Если родитель сбросил координаты извне
watch(
  () => props.modelValue,
  (val) => {
    if (!val?.lat || !val?.lng) {
      if (marker && map) {
        map.removeLayer(marker)
        marker = null
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.map-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.map-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.map-picker__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.map-picker__clear {
  font-size: 0.8rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.map-picker__clear:hover {
  color: #dc2626;
}

.map-picker__hint {
  font-size: 0.82rem;
  color: #6b7280;
  min-height: 1.2em;
}

.map-picker__map {
  height: 280px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  cursor: crosshair;
}
</style>