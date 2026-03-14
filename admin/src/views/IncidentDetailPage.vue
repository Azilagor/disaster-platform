<template>
  <div>
    <div style="margin-bottom: var(--spacing-lg);">
      <router-link to="/incidents" class="btn btn-secondary">← К списку</router-link>
    </div>
    <div v-if="loading" class="card">Загрузка…</div>
    <template v-else-if="incident">
      <div class="card">
        <h1 class="page-title">Инцидент #{{ incident.id }}</h1>
        <dl style="display: grid; gap: var(--spacing-sm);">
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Заголовок</dt><dd>{{ incident.title }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Описание</dt><dd>{{ incident.description || '—' }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Статус</dt><dd><span class="badge">{{ incident.status }}</span></dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Уровень</dt><dd>{{ incident.severity }}</dd></div>
          <div><dt style="color: var(--gray-500); font-size: var(--font-size-sm);">Район</dt><dd>{{ incident.district }}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h2 style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-md);">Редактирование</h2>
        <form @submit.prevent="save">
          <div class="form-group">
            <label>Заголовок</label>
            <input v-model="form.title" class="form-control" />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="form.description" class="form-control" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>Уровень</label>
            <select v-model="form.severity" class="form-control">
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <div class="form-group">
            <label>Район</label>
            <select v-model="form.district" class="form-control">
              <option value="ALMALYNSKIY">ALMALYNSKIY</option>
              <option value="AUEZOVSKIY">AUEZOVSKIY</option>
              <option value="BOSTANDYQ">BOSTANDYQ</option>
              <option value="MEDEU">MEDEU</option>
              <option value="NAURYZBAY">NAURYZBAY</option>
              <option value="TURKSIB">TURKSIB</option>
              <option value="ZHETYSU">ZHETYSU</option>
              <option value="ALATAU">ALATAU</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="saving">Сохранить</button>
          <span v-if="saveMessage" style="margin-left: var(--spacing-md);" :class="saveError ? 'form-error' : ''">{{ saveMessage }}</span>
        </form>
      </div>
      <div class="card" v-if="incident.status !== 'RESOLVED'">
        <h2 style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-md);">Смена статуса</h2>
        <div style="display: flex; gap: var(--spacing-md); align-items: center;">
          <select v-model="statusSelect" class="form-control" style="max-width: 160px;">
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESOLVING">RESOLVING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
          <button type="button" class="btn btn-secondary" :disabled="statusSaving" @click="changeStatus">Изменить статус</button>
          <span v-if="statusMessage" :class="statusError ? 'form-error' : ''">{{ statusMessage }}</span>
        </div>
      </div>
      <div class="card">
        <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDelete">Удалить инцидент</button>
        <span v-if="deleteMessage" class="form-error" style="margin-left: var(--spacing-md);">{{ deleteMessage }}</span>
      </div>
    </template>
    <div v-else class="card">Инцидент не найден</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getIncident, updateIncident, setIncidentStatus, deleteIncident } from '../api/incidents.js'

const route = useRoute()
const router = useRouter()
const incident = ref(null)
const loading = ref(true)
const saving = ref(false)
const statusSaving = ref(false)
const deleting = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const statusMessage = ref('')
const statusError = ref(false)
const deleteMessage = ref('')
const statusSelect = ref('ACTIVE')

const form = reactive({ title: '', description: '', severity: '', district: '' })

function fillForm() {
  if (!incident.value) return
  form.title = incident.value.title ?? ''
  form.description = incident.value.description ?? ''
  form.severity = incident.value.severity ?? 'MEDIUM'
  form.district = incident.value.district ?? ''
  statusSelect.value = incident.value.status ?? 'ACTIVE'
}

async function load() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    incident.value = await getIncident(id)
    fillForm()
  } catch (e) {
    incident.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)

async function save() {
  saveMessage.value = ''
  saveError.value = false
  saving.value = true
  try {
    const data = await updateIncident(incident.value.id, {
      title: form.title?.trim(),
      description: form.description?.trim(),
      severity: form.severity,
      district: form.district,
    })
    if (data.incident) incident.value = data.incident
    saveMessage.value = data.message || 'Сохранено'
  } catch (e) {
    saveMessage.value = e.message || 'Ошибка'
    saveError.value = true
  } finally {
    saving.value = false
  }
}

async function changeStatus() {
  statusMessage.value = ''
  statusError.value = false
  statusSaving.value = true
  try {
    const data = await setIncidentStatus(incident.value.id, statusSelect.value)
    if (data.incident) incident.value = data.incident
    statusMessage.value = data.message || 'Статус изменён'
  } catch (e) {
    statusMessage.value = e.message || 'Ошибка'
    statusError.value = true
  } finally {
    statusSaving.value = false
  }
}

async function confirmDelete() {
  if (!confirm('Удалить инцидент? Это действие необратимо.')) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await deleteIncident(incident.value.id)
    router.push('/incidents')
  } catch (e) {
    deleteMessage.value = e.message || 'Ошибка удаления'
  } finally {
    deleting.value = false
  }
}
</script>
