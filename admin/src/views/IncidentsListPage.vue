<template>
  <div>
    <h1 class="page-title">Инциденты</h1>
    <div style="margin-bottom: var(--spacing-lg);">
      <router-link to="/incidents/new" class="btn btn-primary">Создать инцидент</router-link>
    </div>
    <div class="card">
      <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
        <select v-model="filters.status" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">Все статусы</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESOLVING">RESOLVING</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
        <select v-model="filters.severity" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">Все уровни</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
        <select v-model="filters.district" class="form-control" style="max-width: 160px;" @change="load">
          <option value="">Все районы</option>
          <option value="ALMALYNSKIY">ALMALYNSKIY</option>
          <option value="AUEZOVSKIY">AUEZOVSKIY</option>
          <option value="BOSTANDYQ">BOSTANDYQ</option>
          <option value="MEDEU">MEDEU</option>
          <option value="NAURYZBAY">NAURYZBAY</option>
          <option value="TURKSIB">TURKSIB</option>
          <option value="ZHETYSU">ZHETYSU</option>
          <option value="ALATAU">ALATAU</option>
        </select>
        <button type="button" class="btn btn-secondary" @click="load">Обновить</button>
      </div>
      <div v-if="loading" class="table-wrap">Загрузка…</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Статус</th>
              <th>Уровень</th>
              <th>Район</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in items" :key="i.id">
              <td>{{ i.id }}</td>
              <td>{{ i.title }}</td>
              <td><span class="badge">{{ i.status }}</span></td>
              <td>{{ i.severity }}</td>
              <td>{{ i.district }}</td>
              <td>
                <router-link :to="`/incidents/${i.id}`" class="btn btn-sm btn-secondary">Открыть</router-link>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" style="padding: var(--spacing-md); color: var(--gray-500);">Нет инцидентов</p>
        <p style="margin-top: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500);">Всего: {{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getIncidents } from '../api/incidents.js'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ status: '', severity: '', district: '', page: 1, limit: 20 })

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.status) params.status = filters.status
    if (filters.severity) params.severity = filters.severity
    if (filters.district) params.district = filters.district
    const data = await getIncidents(params)
    items.value = data.items ?? []
    total.value = data.total ?? 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
