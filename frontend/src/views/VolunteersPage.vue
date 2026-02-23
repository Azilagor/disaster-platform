<template>
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
      <div class="topbar">
        <div class="topbar-left">
          <h1>Волонтёры</h1>
          <p class="text-muted">Поиск и назначение волонтёров на запросы</p>
        </div>
      </div>

      <div class="volunteers-toolbar">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
          <input type="text" v-model="searchQuery" placeholder="Поиск по имени или навыку..." class="form-control" style="border: none; padding: 0;" />
        </div>
        <div class="toolbar-filters">
          <select v-model="filterSkill" class="form-control">
            <option value="">Все навыки</option>
            <option value="medical">Медицина</option>
            <option value="logistics">Логистика</option>
            <option value="evacuation">Эвакуация</option>
            <option value="psychology">Психология</option>
          </select>
          <select v-model="filterStatus" class="form-control">
            <option value="">Любой статус</option>
            <option value="online">Онлайн</option>
            <option value="away">Отошёл</option>
            <option value="offline">Офлайн</option>
          </select>
        </div>
      </div>

      <div class="volunteers-grid">
        <div v-for="v in filteredVolunteers" :key="v.id" class="volunteer-card">
          <div class="volunteer-card-header">
            <img :src="v.avatar" alt="" class="volunteer-card-avatar" width="64" height="64" />
            <span class="status-badge" :class="v.status">{{ v.statusLabel }}</span>
          </div>
          <div class="volunteer-card-body">
            <h3>{{ v.name }}</h3>
            <p class="volunteer-email">{{ v.email }}</p>
            <p class="volunteer-phone">{{ v.phone }}</p>
            <div class="volunteer-skills-list">
              <span v-for="s in v.skills" :key="s" class="skill-badge">{{ s }}</span>
            </div>
            <div class="volunteer-meta">
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor"><path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13s4-4.75 4-8c0-2.21-1.79-4-4-4z"/><circle cx="7" cy="5" r="1.5"/></svg>
                {{ v.location }}
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M10 18s8-4 8-10a8 8 0 1 0-16 0c0 6 8 10 8 10z"/></svg>
                Выполнено заданий: {{ v.completedTasks }}
              </div>
            </div>
            <div class="volunteer-rating">
              <span class="rating-value">★ {{ v.rating }}</span>
              <span class="rating-count">({{ v.reviewsCount }} отзывов)</span>
            </div>
            <div v-if="v.currentTask" class="current-task">
              <span class="task-label">Сейчас:</span>
              <span class="task-name">{{ v.currentTask }}</span>
            </div>
          </div>
          <div class="volunteer-card-footer">
            <button type="button" class="btn btn-secondary btn-sm">Написать</button>
            <button type="button" class="btn btn-primary btn-sm">Назначить</button>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button type="button" class="pagination-btn" :disabled="page <= 1" @click="page--">‹</button>
        <span class="pagination-dots">1 из {{ totalPages }}</span>
        <button type="button" class="pagination-btn" :disabled="page >= totalPages" @click="page++">›</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const filterSkill = ref('')
const filterStatus = ref('')
const page = ref(1)

const volunteers = ref([
  { id: 1, name: 'Алексей Козлов', email: 'aleksey@example.com', phone: '+7 777 111-22-33', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=v1', skills: ['Медицина', 'Первая помощь'], location: 'Алматы', status: 'online', statusLabel: 'Онлайн', rating: '4.9', reviewsCount: 24, completedTasks: 18, currentTask: 'Запрос #1247' },
  { id: 2, name: 'Мария Семёнова', email: 'maria@example.com', phone: '+7 701 222-33-44', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=v2', skills: ['Логистика', 'Транспорт'], location: 'Алматы', status: 'away', statusLabel: 'Отошёл', rating: '4.8', reviewsCount: 12, completedTasks: 9, currentTask: null },
  { id: 3, name: 'Дмитрий Волков', email: 'dmitry@example.com', phone: '+7 705 333-44-55', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=v3', skills: ['Эвакуация'], location: 'Алматы', status: 'online', statusLabel: 'Онлайн', rating: '5.0', reviewsCount: 31, completedTasks: 22, currentTask: null },
  { id: 4, name: 'Анна Петрова', email: 'anna@example.com', phone: '+7 702 444-55-66', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=v4', skills: ['Психология'], location: 'Алматы', status: 'offline', statusLabel: 'Офлайн', rating: '4.7', reviewsCount: 8, completedTasks: 5, currentTask: null },
])

const filteredVolunteers = computed(() => {
  let list = volunteers.value
  const q = searchQuery.value.toLowerCase()
  if (q) list = list.filter(v => v.name.toLowerCase().includes(q) || v.skills.some(s => s.toLowerCase().includes(q)))
  if (filterSkill.value) list = list.filter(v => v.skills.some(s => s.toLowerCase().includes(filterSkill.value)))
  if (filterStatus.value) list = list.filter(v => v.status === filterStatus.value)
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVolunteers.value.length / 8)))

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>
