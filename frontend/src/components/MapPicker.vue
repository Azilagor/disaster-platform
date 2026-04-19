<template>
  <div class="map-picker">
    <div ref="mapEl" class="map-picker-inner"></div>
    <p v-if="hint" class="map-picker-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ lat: null, lng: null }),
  },
})

const emit = defineEmits(['update:modelValue', 'address'])

const { t } = useI18n()
const hint = ref('')
const mapEl = ref(null)
let map = null
let marker = null

const DEFAULT = [43.238949, 76.945465]

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'ru,en,kk' } })
    if (!res.ok) return
    const data = await res.json()
    const line = data.display_name || data.address?.road
    if (line) emit('address', line)
  } catch {
    /* ignore */
  }
}

function setMarker(lat, lng) {
  if (!map) return
  const L = window.L
  if (!L) return
  if (marker) map.removeLayer(marker)
  marker = L.marker([lat, lng], { draggable: true }).addTo(map)
  marker.on('dragend', () => {
    const p = marker.getLatLng()
    emit('update:modelValue', { lat: p.lat, lng: p.lng })
    hint.value = t('createRequest.mapOptional')
    reverseGeocode(p.lat, p.lng)
  })
}

onMounted(async () => {
  if (!mapEl.value) return
  const L = (await import('leaflet')).default
  window.L = window.L || L
  const lat = props.modelValue?.lat != null ? Number(props.modelValue.lat) : DEFAULT[0]
  const lng = props.modelValue?.lng != null ? Number(props.modelValue.lng) : DEFAULT[1]
  map = L.map(mapEl.value, { scrollWheelZoom: true }).setView([lat, lng], 13)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)
  map.on('click', (e) => {
    const { lat, lng } = e.latlng
    emit('update:modelValue', { lat, lng })
    setMarker(lat, lng)
    hint.value = t('createRequest.mapOptional')
    reverseGeocode(lat, lng)
  })
  if (props.modelValue?.lat != null && props.modelValue?.lng != null) {
    setMarker(Number(props.modelValue.lat), Number(props.modelValue.lng))
  }
  setTimeout(() => map?.invalidateSize(), 100)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  marker = null
})

watch(
  () => props.modelValue,
  (v) => {
    if (!map || v?.lat == null || v?.lng == null) return
    const lat = Number(v.lat)
    const lng = Number(v.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return
    setMarker(lat, lng)
    map.setView([lat, lng], map.getZoom())
  },
  { deep: true }
)
</script>

<style scoped>
.map-picker {
  width: 100%;
}
.map-picker-inner {
  height: 220px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--gray-200, #e5e7eb);
  background: #e8e8e8;
}
.map-picker-hint {
  font-size: 0.78rem;
  color: var(--gray-500, #6b7280);
  margin-top: 0.35rem;
}
</style>
