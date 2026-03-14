<template>
  <div>
    <h1 class="page-title">Заявки</h1>
    <div class="card">
      <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
        <input v-model="filters.search" type="text" class="form-control" placeholder="Поиск (заголовок, адрес)" style="max-width: 240px;" @input="debounceLoad" />
        <select v-model="filters.status" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">Все статусы</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <select v-model="filters.priority" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">Все приоритеты</option>
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
              <th>Приоритет</th>
              <th>Район</th>
              <th>Опубликовано</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td>{{ r.id }}</td>
              <td>{{ r.title }}</td>
              <td><span class="badge">{{ r.status }}</span></td>
              <td>{{ r.priority }}</td>
              <td>{{ r.district }}</td>
              <td>{{ r.isPublished ? 'Да' : 'Нет' }}</td>
              <td>
                <router-link :to="`/requests/${r.id}`" class="btn btn-sm btn-secondary">Открыть</router-link>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" style="padding: var(--spacing-md); color: var(--gray-500);">Нет заявок</p>
        <p style="margin-top: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500);">Всего: {{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getRequests } from '../api/requests.js'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ search: '', status: '', priority: '', district: '', page: 1, limit: 20 })
let debounceTimer = null

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.search?.trim().length >= 2) params.search = filters.search.trim()
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.district) params.district = filters.district
    const data = await getRequests(params)
    items.value = data.items ?? []
    total.value = data.total ?? 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function debounceLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
}

onMounted(load)
</script>
