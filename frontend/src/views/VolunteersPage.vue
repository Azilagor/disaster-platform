<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t('volunteers.title') }}</h1>
        <p class="text-muted">{{ t('volunteers.subtitle') }}</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="filters.search"
          type="text"
          :placeholder="t('volunteers.searchPh')"
          class="form-control"
        />
      </div>
      <select v-model="filters.district" class="form-control">
        <option value="">{{ t('volunteers.allDistricts') }}</option>
        <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ enumLabel.district(d) }}</option>
      </select>
      <button type="button" class="btn btn-primary" @click="loadVolunteers">{{ t('common.refresh') }}</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('volunteers.thName') }}</th>
            <th>{{ t('volunteers.thEmail') }}</th>
            <th>{{ t('volunteers.thPhone') }}</th>
            <th>{{ t('volunteers.thDistrict') }}</th>
            <th>{{ t('volunteers.thTasks') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in volunteers" :key="v.id">
            <td>
              <div class="volunteer-name-cell">
                <img
                  v-if="v.avatarUrl"
                  :src="v.avatarUrl"
                  alt=""
                  class="volunteer-avatar"
                  width="36"
                  height="36"
                />
                <span>{{ v.firstName }} {{ v.lastName }}</span>
              </div>
            </td>
            <td>{{ v.email }}</td>
            <td>{{ v.phone || t('common.emDash') }}</td>
            <td>{{ enumLabel.district(v.district) || v.district || t('common.emDash') }}</td>
            <td>{{ v._count?.volunteerRequests ?? 0 }}</td>
            <td>
              <router-link :to="'/requests'" class="btn btn-sm btn-outline">{{ t('volunteers.assignLink') }}</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="loading" class="text-muted">{{ t('common.loadingEllipsis') }}</p>
      <p v-else-if="!volunteers.length" class="text-muted">{{ t('volunteers.empty') }}</p>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button type="button" class="btn btn-sm btn-outline" :disabled="filters.page <= 1" @click="filters.page--">‹</button>
      <span class="pagination-info">{{ t('volunteers.paginationOf', { page: filters.page, total: totalPages }) }}</span>
      <button type="button" class="btn btn-sm btn-outline" :disabled="filters.page >= totalPages" @click="filters.page++">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVolunteers } from '../api/users.js'
import { withLoading } from '../stores/loading.js'
import { ALLOWED_DISTRICTS } from '../constants/requests.js'
import { useEnumLabel } from '../composables/useEnumLabel.js'

const { t } = useI18n()
const enumLabel = useEnumLabel()

const loading = ref(false)
const volunteers = ref([])
const total = ref(0)
const filters = reactive({ search: '', district: '', page: 1, limit: 20 })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / filters.limit)))

async function loadVolunteers() {
  loading.value = true
  try {
    const params = { page: filters.page, limit: filters.limit }
    if (filters.search?.trim()) params.search = filters.search.trim()
    if (filters.district) params.district = filters.district
    const data = await withLoading(() => getVolunteers(params))
    volunteers.value = data.items ?? []
    total.value = data.total ?? 0
  } catch (e) {
    volunteers.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [filters.search, filters.district, filters.page],
  () => loadVolunteers(),
  { immediate: true }
)
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;
}
.search-box input { min-width: 200px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th,
.data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; }
.volunteer-name-cell { display: flex; align-items: center; gap: 0.5rem; }
.volunteer-avatar { border-radius: 50%; object-fit: cover; }
.pagination { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; }
.pagination-info { font-size: 0.9rem; color: #666; }
.text-muted { color: #666; font-size: 0.95rem; margin: 0; }
</style>
