<template>
  <div class="profile-page">
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <router-link to="/" class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z" fill="#2563EB"/>
              <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>DisasterHelp</span>
          </router-link>
        </div>
        <nav class="sidebar-nav">
          <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
            Дашборд
          </router-link>
          <router-link to="/map" class="nav-item" :class="{ active: $route.path === '/map' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2C6.13 2 3 5.13 3 9c0 4.17 7 9 7 9s7-4.83 7-9c0-3.87-3.13-7-7-7z"/><circle cx="10" cy="9" r="2.5"/></svg>
            Карта
          </router-link>
          <router-link to="/create-request" class="nav-item" :class="{ active: $route.path === '/create-request' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v16M2 10h16"/></svg>
            Создать запрос
          </router-link>
          <router-link to="/volunteers" class="nav-item" :class="{ active: $route.path === '/volunteers' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="5" r="4"/></svg>
            Волонтёры
          </router-link>
          <router-link to="/profile" class="nav-item" :class="{ active: $route.path === '/profile' }">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="7" r="4"/><path d="M3 20c0-4 3-7 7-7s7 3 7 7"/></svg>
            Профиль
          </router-link>
        </nav>
        <div class="sidebar-footer">
          <a href="#" class="nav-item" @click.prevent="logout">Выйти</a>
        </div>
      </aside>

      <main class="main-content">
        <div class="profile-header">
          <div class="profile-cover"></div>
          <div class="profile-info-section">
            <div class="profile-avatar-wrapper">
              <img :src="userAvatar" alt="" class="profile-avatar" width="120" height="120" />
              <button type="button" class="avatar-upload-btn" title="Сменить фото">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 2L20 6L16 10"/><path d="M4 18v-4M4 14L2 16l-2-2"/><circle cx="10" cy="10" r="8"/></svg>
              </button>
            </div>
            <div class="profile-header-info">
              <h1>{{ userName }}</h1>
              <p class="profile-role">{{ userRole }}</p>
              <div class="profile-meta">
                <span class="meta-badge">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 4h12v12H4z"/><path d="M16 8l-4 4-2-2-4 4"/></svg>
                  {{ user.email }}
                </span>
                <span class="meta-badge">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M18 15v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2"/><path d="M10 2v12M4 8l6 6 6-6"/></svg>
                  {{ user.phone || '—' }}
                </span>
              </div>
              <div class="profile-actions">
                <button type="button" class="btn btn-primary btn-sm">Редактировать профиль</button>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-content">
          <div class="profile-left-column">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Личные данные</h2>
              </div>
              <div class="info-list" style="padding: var(--spacing-xl);">
                <div class="info-item">
                  <span class="info-label">Имя</span>
                  <span class="info-value">{{ user.firstName || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Фамилия</span>
                  <span class="info-value">{{ user.lastName || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ user.email || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Телефон</span>
                  <span class="info-value">{{ user.phone || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Роль</span>
                  <span class="info-value">{{ userRole }}</span>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Статистика</h2>
              </div>
              <div class="profile-stats" style="padding: var(--spacing-xl);">
                <div class="profile-stat-item">
                  <div class="stat-icon stat-icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">12</div>
                    <div class="stat-label">Созданных запросов</div>
                  </div>
                </div>
                <div class="profile-stat-item">
                  <div class="stat-icon stat-icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">8</div>
                    <div class="stat-label">Выполнено (как волонтёр)</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Навыки</h2>
              </div>
              <div style="padding: var(--spacing-xl);">
                <div class="skills-grid">
                  <span v-for="s in skills" :key="s" class="skill-badge-large">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="profile-right-column">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Активность</h2>
              </div>
              <div class="timeline" style="padding: var(--spacing-xl);">
                <div v-for="a in timeline" :key="a.id" class="timeline-item">
                  <div class="timeline-marker" :class="a.type"></div>
                  <div class="timeline-content">
                    <p class="timeline-text" v-html="a.text"></p>
                    <span class="timeline-time">{{ a.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Достижения</h2>
              </div>
              <div class="achievements-grid" style="padding: var(--spacing-xl);">
                <div v-for="ach in achievements" :key="ach.id" class="achievement-item" :class="{ locked: !ach.unlocked }">
                  <div class="achievement-icon">🏅</div>
                  <div class="achievement-info">
                    <h4>{{ ach.title }}</h4>
                    <p>{{ ach.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const userName = computed(() => [user.value.firstName, user.value.lastName].filter(Boolean).join(' ') || 'Пользователь')
const userRole = computed(() => ({ user: 'Пользователь', volunteer: 'Волонтёр', coordinator: 'Координатор' }[user.value.role] || 'Пользователь'))
const userAvatar = computed(() => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(user.value.email || 'profile'))

const skills = ref(['Первая помощь', 'Логистика'])
const timeline = ref([
  { id: 1, type: 'success', text: 'Выполнен запрос <strong>#1247</strong> — медицинская помощь.', time: '2 ч назад' },
  { id: 2, type: 'info', text: 'Назначен на запрос <strong>#1248</strong> — эвакуация.', time: 'Вчера, 14:30' },
  { id: 3, type: 'warning', text: 'Запрос <strong>#1240</strong> отменён координатором.', time: 'Вчера, 10:00' },
])
const achievements = ref([
  { id: 1, title: 'Первый отклик', description: 'Откликнулся на первый запрос', unlocked: true },
  { id: 2, title: '10 выполненных заданий', description: 'Выполнил 10 запросов', unlocked: true },
  { id: 3, title: 'Герой недели', description: 'Топ-3 волонтёра за неделю', unlocked: false },
])

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>
