<template>
  <div>
    <h1 class="page-title">{{ $t('admin.overview') }}</h1>
    <div v-if="loading" class="card">{{ $t('common.loadingEllipsis') }}</div>
    <template v-else-if="overview">
      <div class="widget-grid">
        <div class="widget">
          <div class="widget-title">{{ $t('admin.users') }}</div>
          <div class="widget-value">{{ overview.users.total }}</div>
          <div class="widget-title" style="margin-top: 4px;">{{ $t('admin.unverified', { n: overview.users.unverified }) }}</div>
        </div>
        <div class="widget">
          <div class="widget-title">{{ $t('admin.requests') }}</div>
          <div class="widget-value">{{ overview.requests.total }}</div>
          <div class="widget-title" style="margin-top: 4px;">{{ $t('admin.published', { n: overview.requests.published }) }}</div>
        </div>
        <div class="widget">
          <div class="widget-title">{{ $t('admin.incidents') }}</div>
          <div class="widget-value">{{ overview.incidents.total }}</div>
          <div class="widget-title" style="margin-top: 4px;">{{ $t('admin.activeIncidents', { n: overview.incidents.active }) }}</div>
        </div>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.usersByRole') }}</h2>
        <div class="stats-row">
          <span>{{ $t('roles.USER') }}: <strong>{{ overview.users.byRole.USER ?? 0 }}</strong></span>
          <span>{{ $t('roles.VOLUNTEER') }}: <strong>{{ overview.users.byRole.VOLUNTEER ?? 0 }}</strong></span>
          <span>{{ $t('roles.COORDINATOR') }}: <strong>{{ overview.users.byRole.COORDINATOR ?? 0 }}</strong></span>
          <span>{{ $t('roles.ADMIN') }}: <strong>{{ overview.users.byRole.ADMIN ?? 0 }}</strong></span>
        </div>
      </div>
      <div class="card">
        <h2 class="section-title">{{ $t('admin.requestsByStatus') }}</h2>
        <div class="stats-row">
          <span>{{ $t('enums.requestStatus.NEW') }}: <strong>{{ overview.requests.byStatus.NEW ?? 0 }}</strong></span>
          <span>{{ $t('enums.requestStatus.IN_PROGRESS') }}: <strong>{{ overview.requests.byStatus.IN_PROGRESS ?? 0 }}</strong></span>
          <span>{{ $t('enums.requestStatus.DONE') }}: <strong>{{ overview.requests.byStatus.DONE ?? 0 }}</strong></span>
          <span>{{ $t('enums.requestStatus.CANCELLED') }}: <strong>{{ overview.requests.byStatus.CANCELLED ?? 0 }}</strong></span>
        </div>
      </div>
    </template>
    <div v-else class="card">{{ $t('common.noData') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview } from '../../api/admin.js'

const overview = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    overview.value = await getOverview()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.widget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); }
.widget { background: #fff; border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-md); }
.widget-title { font-size: var(--font-size-sm); color: var(--gray-500); margin-bottom: var(--spacing-xs); }
.widget-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--gray-900); }
.section-title { font-size: var(--font-size-xl); margin-bottom: var(--spacing-md); }
.stats-row { display: flex; gap: var(--spacing-xl); flex-wrap: wrap; }
</style>
