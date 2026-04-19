<template>
  <div class="map-picker">
    <div class="map-picker__header">
      <span class="map-picker__label">{{ $t('mapPicker.label') }}</span>
      <button
        v-if="modelValue.lat && modelValue.lng"
        type="button"
        class="map-picker__clear"
        @click="clearPin"
      >
        {{ $t('mapPicker.clear') }}
      </button>
    </div>

    <div class="map-picker__hint">
      <template v-if="geocoding">{{ $t('mapPicker.geocoding') }}</template>
      <template v-else-if="modelValue.lat && modelValue.lng">
        📍 {{ geocodedAddress || `${modelValue.lat.toFixed(5)}, ${modelValue.lng.toFixed(5)}` }}
      </template>
      <template v-else>{{ $t('mapPicker.clickHint') }}</template>
    </div>

    <div ref="mapEl" class="map-picker__map"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import 'leaflet/dist/leaflet.css'

const ALMATY_CENTER = [43.238949, 76.945465]

const props = defineProps({
  modelValue: { type: Object, default: () => ({ lat: null, lng: null }) },
})
const emit = defineEmits(['update:modelValue', 'address'])

const mapEl = ref(null)
const geocodedAddress = ref('')
const geocoding = ref(false)
let map = null
let marker = null
let L = null

async function reverseGeocode(lat, lng) {
  geocoding.value = true
  geocodedAddress.value = ''
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`,
      { headers: { 'User-Agent': 'DisasterPlatform/1.0' } }
    )
    if (!res.ok) return
    const data = await res.json()
    const a = data.address || {}
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.house_number,
      a.suburb || a.neighbourhood,
    ].filter(Boolean)
    const address = parts.length
      ? parts.join(', ')
      : (data.display_name?.split(',').slice(0, 3).join(', ') || '')
    geocodedAddress.value = address
    emit('address', address)
  } catch {
    /* ignore */
  } finally {
    geocoding.value = false
  }
}

onMounted(async () => {
  await nextTick()
  if (!mapEl.value) return
  L = (await import('leaflet')).default
  map = L.map(mapEl.value).setView(ALMATY_CENTER, 12)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)
  if (props.modelValue?.lat && props.modelValue?.lng) {
    placeMarker(props.modelValue.lat, props.modelValue.lng, false)
    map.setView([props.modelValue.lat, props.modelValue.lng], 15)
  }
  map.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng, true))
  setTimeout(() => map?.invalidateSize(), 150)
})

onUnmounted(() => {
  map?.remove()
  map = null
})

function placeMarker(lat, lng, doGeocode = true) {
  if (!L || !map) return
  if (!marker) {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      emit('update:modelValue', { lat: pos.lat, lng: pos.lng })
      reverseGeocode(pos.lat, pos.lng)
    })
  } else {
    marker.setLatLng([lat, lng])
  }
  emit('update:modelValue', { lat, lng })
  if (doGeocode) reverseGeocode(lat, lng)
}

function clearPin() {
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
  geocodedAddress.value = ''
  emit('update:modelValue', { lat: null, lng: null })
  emit('address', '')
}

watch(
  () => props.modelValue,
  (val) => {
    if (!val?.lat || !val?.lng) {
      if (marker && map) {
        map.removeLayer(marker)
        marker = null
      }
      geocodedAddress.value = ''
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
