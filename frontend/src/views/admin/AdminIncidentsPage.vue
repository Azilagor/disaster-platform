<template>
  <div>
    <h1 class="page-title">{{ t('admin.incidentsTitle') }}</h1>
    <div class="top-row">
      <router-link to="/admin/incidents/new" class="btn btn-primary">{{ t('incidents.create') }}</router-link>
    </div>
    <div class="card">
      <div class="filters-row">
        <select v-model="filters.status" class="form-control" style="max-width: 140px;" @change="load">
          <option value="">{{ t('admin.allStatuses') }}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESOLVING">RESOLVING</option>
          <option value="RESOLVED">RESOLVED</option>
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
              <th>{{ t('admin.thSeverity') }}</th>
              <th>{{ t('admin.thDistrict') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td><span class="badge">{{ enumLabel.incidentStatus(item.status) || item.status }}</span></td>
              <td>{{ enumLabel.severity(item.severity) || item.severity }}</td>
              <td>{{ enumLabel.district(item.district) || item.district }}</td>
              <td><router-link :to="`/admin/incidents/${item.id}`" class="btn btn-sm btn-secondary">{{ t('admin.openDetail') }}</router-link></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading" class="empty-msg">{{ t('admin.noIncidents') }}</p>
        <p class="total-msg">{{ t('admin.totalOf', { total }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIncidents } from '../../api/incidents.js'
import { useEnumLabel } from '../../composables/useEnumLabel.js'

const { t } = useI18n()
const enumLabel = useEnumLabel()

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
