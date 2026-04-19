<template>
  <div>
    <h1 class="page-title">{{ $t('admin.usersTitle') }}</h1>
    <div class="card">
      <div class="filters-row">
        <input v-model="filters.search" type="text" class="form-control" :placeholder="$t('common.search')" style="max-width: 220px;" @input="debounceLoad" />
        <select v-model="filters.role" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">{{ $t('admin.allRoles') }}</option>
          <option value="USER">USER</option>
          <option value="VOLUNTEER">VOLUNTEER</option>
          <option value="COORDINATOR">COORDINATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="button" class="btn btn-secondary" @click="load">{{ $t('common.refresh') }}</button>
      </div>
      <div v-if="loading" class="table-wrap">{{ $t('common.loadingEllipsis') }}</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.idColumn') }}</th>
              <th>{{ $t('volunteers.thName') }}</th>
              <th>{{ $t('common.email') }}</th>
              <th>{{ $t('auth.role') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ [u.firstName, u.lastName].filter(Boolean).join(' ') || '—' }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge">{{ u.role }}</span></td>
              <td><router-link :to="`/admin/users/${u.id}`" class="btn btn-sm btn-secondary">{{ $t('common.open') }}</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="empty-msg">{{ $t('admin.emptyUsers') }}</p>
        <p class="total-msg">{{ $t('common.total', { n: total }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers } from '../../api/users.js'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ search: '', role: '', page: 1, limit: 20 })
let debounceTimer = null

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.search?.trim().length >= 2) params.search = filters.search.trim()
    if (filters.role) params.role = filters.role
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

<style scoped>
.filters-row { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200); }
.data-table th { font-weight: 600; background: var(--gray-50); font-size: var(--font-size-sm); }
.badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.empty-msg, .total-msg { padding: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500); }
</style>
