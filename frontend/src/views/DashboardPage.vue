<template>
  <div>
    <div class="topbar">
      <div class="topbar-left">
        <h1>Дашборд</h1>
        <p class="text-muted">Обзор активности и запросов</p>
      </div>
      <div class="topbar-right">
        <button type="button" class="icon-button" title="Уведомления">
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
        </button>
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
            <span class="stat-title">Активные запросы</span>
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
        <p class="stat-description">Моих заявок</p>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">{{ isCoordinatorOrAdmin ? 'Пользователей' : 'Волонтёры онлайн' }}</span>
        </div>
        <div class="stat-number">{{ isCoordinatorOrAdmin && userStats ? userStats.total : '24' }}</div>
        <p class="stat-description">{{ isCoordinatorOrAdmin ? 'Всего в системе' : 'Готовы помочь' }}</p>
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
          <span class="stat-title">Выполнено сегодня</span>
          <span class="stat-change negative">-2%</span>
        </div>
        <div class="stat-number">19</div>
        <p class="stat-description">Запросов закрыто</p>
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
          <span class="stat-title">{{ isCoordinatorOrAdmin ? 'Без верификации' : 'Срочные' }}</span>
        </div>
        <div class="stat-number">{{ isCoordinatorOrAdmin && userStats ? userStats.unverified : '7' }}</div>
        <p class="stat-description">{{ isCoordinatorOrAdmin ? 'Email не подтверждён' : 'Требуют внимания' }}</p>
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
          <h2 class="card-title">Последние запросы</h2>
          <select v-model="requestsFilter" class="form-select-sm">
            <option value="all">Все</option>
            <option value="urgent">Срочные</option>
            <option value="new">Новые</option>
          </select>
        </div>
        <div v-if="requestsLoading" class="request-list request-list-loading">Загрузка заявок...</div>
        <div v-else-if="requestsError" class="request-list request-list-error">{{ requestsError }}</div>
        <div v-else-if="displayedRequests.length === 0" class="request-list request-list-empty">
          Нет заявок. <router-link to="/create-request">Создать запрос</router-link>
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
          <h2 class="card-title">Волонтёры</h2>
          <router-link v-if="authStore.user?.role === 'COORDINATOR' || authStore.user?.role === 'ADMIN'" to="/volunteers" class="btn btn-sm btn-outline">Все</router-link>
        </div>
        <div v-if="volunteersLoading" class="volunteer-list volunteer-list-loading">Загрузка...</div>
        <div v-else-if="!volunteers.length" class="volunteer-list volunteer-list-empty">Нет данных о волонтёрах</div>
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
          <h2 class="card-title">Активные инциденты</h2>
          <router-link v-if="isCoordinatorOrAdmin" to="/incidents" class="btn btn-sm btn-outline">Все</router-link>
        </div>
        <div v-if="incidentsLoading" class="incidents-loading">Загрузка...</div>
        <div v-else-if="!activeIncidents.length" class="incidents-empty">Нет активных инцидентов</div>
        <ul v-else class="incidents-list">
          <li v-for="inc in activeIncidents" :key="inc.id" class="incident-item">
            <span class="incident-severity" :class="(inc.severity || '').toLowerCase()">{{ severityLabel(inc.severity) }}</span>
            <router-link :to="'/incidents?highlight=' + inc.id" class="incident-title">{{ inc.title }}</router-link>
            <span class="incident-district">{{ DISTRICT_LABELS[inc.district] || inc.district }}</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Активность</h2>
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
import { useAuthStore } from '../stores/auth.js'
import { getMyRequests } from '../api/requests.js'
import { getVolunteers, getUsersStats } from '../api/users.js'
import { getActiveIncidents } from '../api/incidents.js'
import { PRIORITY_LABELS, DISTRICT_LABELS } from '../constants/requests.js'

const authStore = useAuthStore()
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

const SEVERITY_LABELS = { CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' }
function severityLabel(s) {
  return SEVERITY_LABELS[s] || s || '—'
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн. назад`
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
      priorityLabel: PRIORITY_LABELS[r.priority] ?? r.priority,
      badgeClass: priorityBadgeClass(r.priority),
      status: r.status,
    }))
  } catch (e) {
    requestsError.value = e.message || 'Не удалось загрузить заявки'
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
  }
  try {
    const data = await getVolunteers({ limit: 10 })
    const items = data.items ?? []
    volunteers.value = items.map((v) => ({
      id: v.id,
      name: [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Волонтёр',
      avatar: v.avatarUrl || '',
      skills: [],
      location: DISTRICT_LABELS[v.district] || v.district || '—',
      status: 'volunteer',
      statusLabel: 'Волонтёр',
      rating: v._count?.volunteerRequests ?? '—',
    }))
  } catch (_) {
    volunteers.value = []
  } finally {
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

const activity = ref([
  {
    id: 1,
    type: 'success',
    icon: '✓',
    text: 'Запрос <strong>#1247</strong> выполнен волонтёром Алексей К.',
    time: '10 мин назад',
  },
  {
    id: 2,
    type: 'info',
    icon: 'i',
    text: 'Новый запрос <strong>Медицинская помощь</strong> в районе Абая.',
    time: '25 мин назад',
  },
  {
    id: 3,
    type: 'warning',
    icon: '!',
    text: 'Запрос <strong>#1240</strong> ожидает назначения более 2 часов.',
    time: '1 ч назад',
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
