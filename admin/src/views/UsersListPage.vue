<template>
  <div>
    <h1 class="page-title">Пользователи</h1>
    <div class="card">
      <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
        <input v-model="filters.search" type="text" class="form-control" placeholder="Поиск (имя, email, телефон)" style="max-width: 240px;" @input="debounceLoad" />
        <select v-model="filters.role" class="form-control" style="max-width: 160px;" @change="load">
          <option value="">Все роли</option>
          <option value="USER">USER</option>
          <option value="VOLUNTEER">VOLUNTEER</option>
          <option value="COORDINATOR">COORDINATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select v-model="filters.district" class="form-control" style="max-width: 180px;" @change="load">
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
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Район</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ [u.firstName, u.lastName].filter(Boolean).join(' ') || '—' }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge">{{ u.role }}</span></td>
              <td>{{ u.district || '—' }}</td>
              <td>
                <router-link :to="`/users/${u.id}`" class="btn btn-sm btn-secondary">Открыть</router-link>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" style="padding: var(--spacing-md); color: var(--gray-500);">Нет пользователей</p>
        <p style="margin-top: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500);">Всего: {{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers } from '../api/users.js'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ search: '', role: '', district: '', page: 1, limit: 20 })
let debounceTimer = null

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.search?.trim().length >= 2) params.search = filters.search.trim()
    if (filters.role) params.role = filters.role
    if (filters.district) params.district = filters.district
    const data = await getUsers(params)
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
