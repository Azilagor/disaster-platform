<template>
  <div>
    <h1 class="page-title">{{ t('admin.requestsTitle') }}</h1>
    <div class="card">
      <div class="filters-row">
        <input
          v-model="filters.search"
          type="text"
          class="form-control"
          :placeholder="t('common.search')"
          style="max-width: 220px;"
          @input="debounceLoad"
        />
        <select v-model="filters.status" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">{{ t('admin.allStatuses') }}</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button type="button" class="btn btn-secondary" @click="load">{{ t('common.refresh') }}</button>
      </div>
      <div v-if="loading" class="table-wrap">{{ t('admin.loading') }}</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('admin.thId') }}</th>
              <th>{{ t('admin.thTitle') }}</th>
              <th>{{ t('admin.thStatus') }}</th>
              <th>{{ t('admin.thPriority') }}</th>
              <th>{{ t('admin.thPublished') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td>{{ r.id }}</td>
              <td>{{ r.title }}</td>
              <td><span class="badge">{{ enumLabel.requestStatus(r.status) || r.status }}</span></td>
              <td>{{ enumLabel.priority(r.priority) || r.priority }}</td>
              <td>{{ r.isPublished ? t('common.yes') : t('common.no') }}</td>
              <td><router-link :to="`/admin/requests/${r.id}`" class="btn btn-sm btn-secondary">{{ t('admin.openDetail') }}</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="empty-msg">{{ t('admin.noRequests') }}</p>
        <p class="total-msg">{{ t('admin.totalOf', { total }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRequests } from '../../api/requests.js'
import { useEnumLabel } from '../../composables/useEnumLabel.js'

const { t } = useI18n()
const enumLabel = useEnumLabel()

const items = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ search: '', status: '', page: 1, limit: 20 })
let debounceTimer = null

async function load() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.search?.trim().length >= 2) params.search = filters.search.trim()
    if (filters.status) params.status = filters.status
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

<style scoped>
.filters-row { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--gray-200); }
.data-table th { font-weight: 600; background: var(--gray-50); font-size: var(--font-size-sm); }
.badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.empty-msg, .total-msg { padding: var(--spacing-md); font-size: var(--font-size-sm); color: var(--gray-500); }
</style>
