<template>
  <div>
    <div class="topbar">
        <div class="topbar-left">
          <h1>Дашборд</h1>
          <p class="text-muted">Обзор активности и запросов</p>
        </div>
        <div class="topbar-right">
          <button type="button" class="icon-button" title="Уведомления">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2a6 6 0 0 1 6 6v4l2 2v1H2v-1l2-2V8a6 6 0 0 1 6-6z"/><circle cx="14" cy="4" r="2" fill="currentColor" class="notification-dot"/></svg>
          </button>
          <div class="user-menu">
            <img v-if="authStore.userAvatar" :src="authStore.userAvatar" alt="" class="user-avatar" width="40" height="40" />
            <div class="user-info">
              <span class="user-name">{{ authStore.userName }}</span>
              <span class="user-role">{{ authStore.userRole }}</span>
            </div>
          </div>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            </div>
          </div>
          <div class="stat-number">48</div>
          <p class="stat-description">За последние 7 дней</p>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Волонтёры онлайн</span>
            <span class="stat-change positive">+5</span>
          </div>
          <div class="stat-number">24</div>
          <p class="stat-description">Готовы помочь</p>
          <div class="stat-icon stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Срочные</span>
          </div>
          <div class="stat-number">7</div>
          <p class="stat-description">Требуют внимания</p>
          <div class="stat-icon stat-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card card-wide">
          <div class="card-header">
            <h2 class="card-title">Последние запросы</h2>
            <select class="form-select-sm" v-model="requestsFilter">
              <option value="all">Все</option>
              <option value="urgent">Срочные</option>
              <option value="new">Новые</option>
            </select>
          </div>
          <div class="request-list">
            <router-link
              v-for="req in displayedRequests"
              :key="req.id"
              :to="'/map?request=' + req.id"
              class="request-item"
              :class="{ urgent: req.priority === 'urgent' }"
            >
              <div class="request-badge" :class="req.badgeClass">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2L2 6v8l8 4 8-4V6l-8-4z"/></svg>
              </div>
              <div class="request-content">
                <h3>{{ req.title }}</h3>
                <div class="request-location">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"><path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13s4-4.75 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.5"/></svg>
                  {{ req.location }}
                </div>
                <div class="request-meta">
                  <span class="request-time">{{ req.time }}</span>
                  <span class="request-priority" :class="req.priority + '-priority'">{{ req.priorityLabel }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Волонтёры</h2>
            <router-link to="/volunteers" class="btn btn-sm btn-outline">Все</router-link>
          </div>
          <div class="volunteer-list">
            <div v-for="v in volunteers" :key="v.id" class="volunteer-item">
              <img :src="v.avatar" alt="" class="volunteer-avatar" width="48" height="48" />
              <div class="volunteer-info">
                <h3>{{ v.name }}</h3>
                <div class="volunteer-skills">
                  <span v-for="s in v.skills" :key="s" class="skill-badge">{{ s }}</span>
                </div>
                <div class="volunteer-location">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor"><path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13s4-4.75 4-8c0-2.21-1.79-4-4-4z"/></svg>
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
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const requestsFilter = ref('all')
const requests = ref([
  { id: 1, title: 'Требуется медицинская помощь', location: 'г. Алматы, ул. Абая, 150', time: '15 мин назад', priority: 'urgent', priorityLabel: 'Срочно', badgeClass: '' },
  { id: 2, title: 'Нужна эвакуация', location: 'г. Алматы, мкр. Самал-2', time: '1 ч назад', priority: 'high', priorityLabel: 'Высокий', badgeClass: 'warning' },
  { id: 3, title: 'Продукты и вода', location: 'г. Алматы, ул. Толе би, 59', time: '2 ч назад', priority: 'medium', priorityLabel: 'Средний', badgeClass: 'info' },
])
const displayedRequests = computed(() => {
  if (requestsFilter.value === 'urgent') return requests.value.filter(r => r.priority === 'urgent')
  if (requestsFilter.value === 'new') return requests.value.filter(r => r.time.includes('мин'))
  return requests.value
})

const volunteers = ref([
  { id: 1, name: 'Алексей К.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=a1', skills: ['Медицина'], location: 'Алматы', status: 'online', statusLabel: 'Онлайн', rating: '4.9' },
  { id: 2, name: 'Мария С.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m2', skills: ['Логистика'], location: 'Алматы', status: 'away', statusLabel: 'Отошёл', rating: '4.8' },
  { id: 3, name: 'Дмитрий В.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=d3', skills: ['Эвакуация'], location: 'Алматы', status: 'online', statusLabel: 'Онлайн', rating: '5.0' },
])

const activity = ref([
  { id: 1, type: 'success', icon: '✓', text: 'Запрос <strong>#1247</strong> выполнен волонтёром Алексей К.', time: '10 мин назад' },
  { id: 2, type: 'info', icon: 'i', text: 'Новый запрос <strong>Медицинская помощь</strong> в районе Абая.', time: '25 мин назад' },
  { id: 3, type: 'warning', icon: '!', text: 'Запрос <strong>#1240</strong> ожидает назначения более 2 часов.', time: '1 ч назад' },
])

</script>
