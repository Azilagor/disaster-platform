<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Мои заявки</h1>
        <p class="text-muted">Заявки, созданные вами. GET /requests/my</p>
      </div>
      <div class="topbar-right">
        <router-link to="/create-request" class="btn btn-primary">Создать заявку</router-link>
      </div>
    </div>

    <div v-if="loading" class="text-muted">Загрузка...</div>
    <div v-else-if="error" class="auth-message auth-message-error">{{ error }}</div>
    <div v-else-if="!requests.length" class="empty-state">
      <p>У вас пока нет заявок.</p>
      <router-link to="/create-request" class="btn btn-primary">Создать первую заявку</router-link>
    </div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Заголовок</th>
            <th>Тип</th>
            <th>Приоритет</th>
            <th>Район</th>
            <th>Статус</th>
            <th>Публикация</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in requests" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.title }}</td>
            <td>{{ PROBLEM_TYPE_LABELS[r.problemType] || r.problemType }}</td>
            <td>{{ PRIORITY_LABELS[r.priority] || r.priority }}</td>
            <td>{{ DISTRICT_LABELS[r.district] || r.district }}</td>
            <td>{{ REQUEST_STATUS_LABELS[r.status] || r.status }}</td>
            <td>
              <span v-if="r.isPublished" class="badge badge-success">Опубликована</span>
              <span v-else class="badge badge-secondary">Не опубликована</span>
            </td>
            <td>
              <router-link :to="'/map?request=' + r.id" class="btn btn-sm btn-outline">На карте</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyRequests } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'
import {
  PRIORITY_LABELS,
  PROBLEM_TYPE_LABELS,
  DISTRICT_LABELS,
  REQUEST_STATUS_LABELS,
} from '../constants/requests.js'

const requests = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const list = await withLoading(() => getMyRequests({ limit: 100 }))
    requests.value = list
  } catch (e) {
    error.value = e.message || 'Не удалось загрузить заявки'
    requests.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.topbar-right { flex-shrink: 0; }
.text-muted { color: #666; font-size: 0.95rem; margin: 0; }
.empty-state { padding: 2rem; text-align: center; }
.empty-state p { margin-bottom: 1rem; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th,
.data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; }
.badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85em; }
.badge-success { background: #d4edda; color: #155724; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
</style>
