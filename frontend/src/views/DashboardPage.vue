<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ $t('dashboard.title') }}</h1>
        <p class="text-muted">{{ $t('dashboard.subtitle') }}</p>
      </div>
      <div class="topbar-right">
        <router-link to="/notifications" class="icon-button" :title="$t('common.notifications')">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 2a6 6 0 0 1 6 6v4l2 2v1H2v-1l2-2V8a6 6 0 0 1 6-6z" />
            <circle cx="14" cy="4" r="2" fill="currentColor" class="notification-dot" />
          </svg>
        </router-link>
        <router-link to="/profile" class="user-menu">
          <img
            v-if="authStore.userAvatar"
            :src="authStore.userAvatar"
            alt=""
            class="user-avatar"
            width="40"
            height="40"
          />
          <div class="user-info">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-role">{{ authStore.userRole }}</span>
          </div>
        </router-link>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div>
            <span class="stat-title">{{ $t('dashboard.statActiveTitle') }}</span>
            <span class="stat-change positive">+12%</span>
          </div>
          <div class="stat-icon stat-icon-blue">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          </div>
        </div>
        <div class="stat-number">{{ requestsLoading ? '—' : requests.length }}</div>
        <p class="stat-description">{{ $t('dashboard.statMyRequests') }}</p>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">{{
            isCoordinatorOrAdmin ? $t('dashboard.statUsers') : $t('dashboard.statVolunteersOnline')
          }}</span>
        </div>
        <div class="stat-number">{{ isCoordinatorOrAdmin && userStats ? userStats.total : '24' }}</div>
        <p class="stat-description">{{
          isCoordinatorOrAdmin ? $t('dashboard.statInSystem') : $t('dashboard.statReady')
        }}</p>
        <div class="stat-icon stat-icon-green">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">{{ $t('dashboard.statDoneToday') }}</span>
          <span class="stat-change negative">-2%</span>
        </div>
        <div class="stat-number">19</div>
        <p class="stat-description">{{ $t('dashboard.statClosed') }}</p>
        <div class="stat-icon stat-icon-orange">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">{{
            isCoordinatorOrAdmin ? $t('dashboard.statUnverified') : $t('dashboard.statUrgent')
          }}</span>
        </div>
        <div class="stat-number">{{ isCoordinatorOrAdmin && userStats ? userStats.unverified : '7' }}</div>
        <p class="stat-description">{{
          isCoordinatorOrAdmin ? $t('dashboard.statEmailUnverified') : $t('dashboard.statNeedAttention')
        }}</p>
        <div class="stat-icon stat-icon-purple">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card card-wide">
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.recentRequests') }}</h2>
          <div class="card-header-actions">
            <select v-model="requestsFilter" class="form-select-sm">
              <option value="all">{{ $t('dashboard.filterAll') }}</option>
              <option value="urgent">{{ $t('dashboard.filterUrgent') }}</option>
              <option value="new">{{ $t('dashboard.filterNew') }}</option>
            </select>
            <router-link
              v-if="authStore.user?.role === 'USER' || isCoordinatorOrAdmin"
              to="/create-request"
              class="btn btn-sm btn-primary"
              >{{ $t('dashboard.createRequestLink') }}</router-link
            >
          </div>
        </div>
        <div v-if="requestsLoading" class="request-list request-list-loading">{{ $t('dashboard.loadingRequests') }}</div>
        <div v-else-if="requestsError" class="request-list request-list-error">{{ requestsError }}</div>
        <div v-else-if="displayedRequests.length === 0" class="request-list request-list-empty">
          {{ $t('dashboard.noRequests') }}
          <router-link to="/create-request">{{ $t('dashboard.createRequestLink') }}</router-link>
        </div>
        <div v-else class="request-list">
          <router-link
            v-for="req in displayedRequests"
            :key="req.id"
            :to="'/map?request=' + req.id"
            class="request-item"
            :class="{ urgent: req.priority === 'CRITICAL' }"
          >
            <div class="request-badge" :class="req.badgeClass">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M10 2L2 6v8l8 4 8-4V6l-8-4z" />
              </svg>
            </div>
            <div class="request-content">
              <h3>{{ req.title }}</h3>
              <div class="request-location">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                  <path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13s4-4.75 4-8c0-2.21-1.79-4-4-4z" />
                  <circle cx="7" cy="5" r="1.5" />
                </svg>
                {{ req.location }}
              </div>
              <div class="request-meta">
                <span class="request-time">{{ req.time }}</span>
                <span class="request-priority" :class="requestPriorityClass(req.priority)">{{
                  req.priorityLabel
                }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.volunteersTitle') }}</h2>
          <router-link
            v-if="authStore.user?.role === 'COORDINATOR' || authStore.user?.role === 'ADMIN'"
            to="/volunteers"
            class="btn btn-sm btn-outline"
            >{{ $t('dashboard.allBtn') }}</router-link
          >
        </div>
        <div v-if="volunteersLoading" class="volunteer-list volunteer-list-loading">{{ $t('dashboard.loadingShort') }}</div>
        <div v-else-if="!volunteers.length" class="volunteer-list volunteer-list-empty">{{ $t('dashboard.noVolunteerData') }}</div>
        <div v-else class="volunteer-list">
          <div v-for="v in volunteers" :key="v.id" class="volunteer-item">
            <img v-if="v.avatar" :src="v.avatar" alt="" class="volunteer-avatar" width="48" height="48" />
            <div v-else class="volunteer-avatar volunteer-avatar-placeholder">?</div>
            <div class="volunteer-info">
              <h3>{{ v.name }}</h3>
              <div class="volunteer-skills">
                <span v-for="s in v.skills" :key="s" class="skill-badge">{{ s }}</span>
              </div>
              <div class="volunteer-location">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                  <path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13s4-4.75 4-8c0-2.21-1.79-4-4-4z" />
                </svg>
                {{ v.location }}
              </div>
            </div>
            <div class="volunteer-status">
              <span class="status-badge" :class="v.status">{{ v.statusLabel }}</span>
              <div class="volunteer-rating">★ {{ v.rating }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.incidentsTitle') }}</h2>
          <router-link v-if="isCoordinatorOrAdmin" to="/incidents" class="btn btn-sm btn-outline">{{
            $t('dashboard.allBtn')
          }}</router-link>
        </div>
        <div v-if="incidentsLoading" class="incidents-loading">{{ $t('dashboard.loadingShort') }}</div>
        <div v-else-if="!activeIncidents.length" class="incidents-empty">{{ $t('dashboard.noIncidents') }}</div>
        <ul v-else class="incidents-list">
          <li v-for="inc in activeIncidents" :key="inc.id" class="incident-item">
            <span class="incident-severity" :class="(inc.severity || '').toLowerCase()">{{ severityLabel(inc.severity) }}</span>
            <router-link :to="'/incidents?highlight=' + inc.id" class="incident-title">{{ inc.title }}</router-link>
            <span class="incident-district">{{ districtLabel(inc.district) }}</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.activityTitle') }}</h2>
        </div>
        <div class="activity-list">
          <div v-for="a in activity" :key="a.id" class="activity-item">
            <div class="activity-icon" :class="a.type">{{ a.icon }}</div>
            <div class="activity-content">
              <p v-html="a.text"></p>
              <span class="activity-time">{{ a.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'
import { getMyRequests } from '../api/requests.js'
import { getVolunteers, getUsersStats } from '../api/users.js'
import { getActiveIncidents } from '../api/incidents.js'
import { useEnumLabel } from '../composables/useEnumLabel.js'

const authStore = useAuthStore()
const { t } = useI18n()
const labels = useEnumLabel()
const isCoordinatorOrAdmin = computed(() => {
  const r = (authStore.user?.role || '').toUpperCase()
  return r === 'COORDINATOR' || r === 'ADMIN'
})

const requestsFilter = ref('all')
const requests = ref([])
const requestsLoading = ref(true)
const requestsError = ref('')
const volunteers = ref([])
const volunteersLoading = ref(true)
const userStats = ref(null)
const activeIncidents = ref([])
const incidentsLoading = ref(true)

function severityLabel(s) {
  if (!s) return t('common.emDash')
  return labels.severity(s) || s
}

function districtLabel(code) {
  if (!code) return t('common.emDash')
  return labels.district(code) || code
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return t('common.emDash')
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return t('dashboard.timeMinutesAgo', { n: diffMins })
  if (diffHours < 24) return t('dashboard.timeHoursAgo', { n: diffHours })
  if (diffDays < 7) return t('dashboard.timeDaysAgo', { n: diffDays })
  return d.toLocaleDateString()
}

function priorityBadgeClass(priority) {
  if (priority === 'CRITICAL') return ''
  if (priority === 'HIGH') return 'warning'
  return 'info'
}

function requestPriorityClass(priority) {
  if (priority === 'CRITICAL') return 'urgent-priority'
  return (priority || '').toLowerCase() + '-priority'
}

onMounted(async () => {
  try {
    const list = await getMyRequests()
    requests.value = list.map((r) => ({
      id: r.id,
      title: r.title,
      location: r.address,
      time: formatTimeAgo(r.createdAt),
      priority: r.priority,
      priorityLabel: labels.priority(r.priority) ?? r.priority,
      badgeClass: priorityBadgeClass(r.priority),
      status: r.status,
    }))
  } catch (e) {
    requestsError.value = e.message || t('dashboard.loadError')
  } finally {
    requestsLoading.value = false
  }
  if (isCoordinatorOrAdmin.value) {
    try {
      const stats = await getUsersStats()
      userStats.value = stats
    } catch (_) {
      userStats.value = null
    }
    try {
      const data = await getVolunteers({ limit: 10 })
      const items = data.items ?? []
      volunteers.value = items.map((v) => ({
        id: v.id,
        name: [v.firstName, v.lastName].filter(Boolean).join(' ') || t('dashboard.volunteerFallback'),
        avatar: v.avatarUrl || '',
        skills: [],
        location: districtLabel(v.district) || v.district || t('common.emDash'),
        status: 'volunteer',
        statusLabel: t('dashboard.volunteerFallback'),
        rating: v._count?.volunteerRequests ?? '—',
      }))
    } catch (_) {
      volunteers.value = []
    } finally {
      volunteersLoading.value = false
    }
  } else {
    volunteersLoading.value = false
  }
  try {
    const list = await getActiveIncidents()
    activeIncidents.value = Array.isArray(list) ? list : []
  } catch (_) {
    activeIncidents.value = []
  } finally {
    incidentsLoading.value = false
  }
})

const displayedRequests = computed(() => {
  let list = requests.value
  if (requestsFilter.value === 'urgent') list = list.filter((r) => r.priority === 'CRITICAL')
  if (requestsFilter.value === 'new') list = list.filter((r) => r.status === 'NEW')
  return list
})

const activity = computed(() => [
  {
    id: 1,
    type: 'success',
    icon: '✓',
    text: t('dashboard.activity1'),
    time: t('dashboard.time10m'),
  },
  {
    id: 2,
    type: 'info',
    icon: 'i',
    text: t('dashboard.activity2'),
    time: t('dashboard.time25m'),
  },
  {
    id: 3,
    type: 'warning',
    icon: '!',
    text: t('dashboard.activity3'),
    time: t('dashboard.time1h'),
  },
])
</script>

<style scoped>
.incidents-loading,
.incidents-empty { padding: var(--spacing-xl); color: var(--gray-600); }
.incidents-list { list-style: none; padding: 0 var(--spacing-xl) var(--spacing-xl); margin: 0; }
.incident-item { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100); }
.incident-item:last-child { border-bottom: none; }
.incident-severity { font-size: 0.75rem; padding: 0.2rem 0.4rem; border-radius: 4px; }
.incident-severity.critical { background: #fecaca; color: #991b1b; }
.incident-severity.high { background: #fed7aa; color: #9a3412; }
.incident-severity.medium { background: #fef08a; color: #854d0e; }
.incident-severity.low { background: #d1fae5; color: #065f46; }
.incident-title { flex: 1; min-width: 0; font-weight: 500; }
.incident-district { font-size: 0.875rem; color: var(--gray-600); }
</style>
