<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ $t('myRequests.title') }}</h1>
        <p class="text-muted">{{ $t('myRequests.subtitle') }}</p>
      </div>
      <div class="topbar-right">
        <router-link to="/create-request" class="btn btn-primary">{{ $t('myRequests.create') }}</router-link>
      </div>
    </div>

    <div v-if="loading" class="text-muted">{{ $t('common.loading') }}</div>
    <div v-else-if="error" class="auth-message auth-message-error">{{ error }}</div>
    <div v-else-if="!requests.length" class="empty-state">
      <p>{{ $t('myRequests.empty') }}</p>
      <router-link to="/create-request" class="btn btn-primary">{{ $t('myRequests.createFirst') }}</router-link>
    </div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ $t('common.idColumn') }}</th>
            <th>{{ $t('myRequests.thTitle') }}</th>
            <th>{{ $t('myRequests.thType') }}</th>
            <th>{{ $t('myRequests.thPriority') }}</th>
            <th>{{ $t('myRequests.thDistrict') }}</th>
            <th>{{ $t('myRequests.thStatus') }}</th>
            <th>{{ $t('myRequests.thPublished') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in requests" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.title }}</td>
            <td>{{ $t('enums.problemType.' + r.problemType) }}</td>
            <td>{{ $t('enums.priority.' + r.priority) }}</td>
            <td>{{ $t('enums.district.' + r.district) }}</td>
            <td>{{ $t('enums.requestStatus.' + r.status) }}</td>
            <td>
              <span v-if="r.isPublished" class="badge badge-success">{{ $t('myRequests.published') }}</span>
              <span v-else class="badge badge-secondary">{{ $t('myRequests.notPublished') }}</span>
            </td>
            <td>
              <router-link :to="'/map?request=' + r.id" class="btn btn-sm btn-outline">{{ $t('myRequests.onMap') }}</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMyRequests } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'

const { t } = useI18n()

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
    error.value = e.message || t('myRequests.loadError')
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
