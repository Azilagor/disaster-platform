<template>
  <div>
    <h1 class="page-title">Инциденты</h1>
    <div class="top-row">
      <router-link to="/admin/incidents/new" class="btn btn-primary">Создать инцидент</router-link>
    </div>
    <div class="card">
      <div class="filters-row">
        <select v-model="filters.status" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">Все статусы</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESOLVING">RESOLVING</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
        <button type="button" class="btn btn-secondary" @click="load">Обновить</button>
      </div>
      <div v-if="loading" class="table-wrap">Загрузка…</div>
      <div v-else class="table-wrap">
        <table class="data-table">
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
              <td><router-link :to="`/admin/incidents/${i.id}`" class="btn btn-sm btn-secondary">Открыть</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="empty-msg">Нет инцидентов</p>
        <p class="total-msg">Всего: {{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getIncidents } from '../../api/incidents.js'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ status: '', page: 1, limit: 20 })

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.status) params.status = filters.status
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

<style scoped>
.top-row { margin-bottom: var(--spacing-lg); }
.filters-row { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200); }
.data-table th { font-weight: 600; background: var(--gray-50); font-size: var(--font-size-sm); }
.badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.empty-msg, .total-msg { padding: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500); }
</style>
