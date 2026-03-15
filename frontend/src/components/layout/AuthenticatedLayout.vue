<template>
  <div class="dashboard-layout">
    <header class="mobile-header" aria-hidden="true">
      <router-link to="/" class="mobile-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z"
            fill="#2563EB"
          />
          <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>DisasterHelp</span>
      </router-link>
      <button
        type="button"
        class="mobile-menu-btn"
        aria-label="Открыть меню"
        :aria-expanded="sidebarOpen"
        @click="sidebarOpen = !sidebarOpen"
      >
        <svg v-if="!sidebarOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </header>
    <div v-if="sidebarOpen" class="sidebar-backdrop" aria-hidden="true" @click="sidebarOpen = false" />
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <router-link to="/" class="logo" @click="sidebarOpen = false">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z"
              fill="#2563EB"
            />
            <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span>DisasterHelp</span>
        </router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link
          to="/dashboard"
          class="nav-item"
          :class="{ active: $route.path === '/dashboard' }"
          @click="sidebarOpen = false"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="11" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="11" width="6" height="6" rx="1" />
            <rect x="11" y="11" width="6" height="6" rx="1" />
          </svg>
          Дашборд
        </router-link>
        <router-link to="/map" class="nav-item" :class="{ active: $route.path === '/map' }" @click="sidebarOpen = false">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10 2C6.13 2 3 5.13 3 9c0 4.17 7 9 7 9s7-4.83 7-9c0-3.87-3.13-7-7-7z" />
            <circle cx="10" cy="9" r="2.5" />
          </svg>
          Карта
        </router-link>
        <router-link
          v-if="canCreateRequest"
          to="/create-request"
          class="nav-item"
          :class="{ active: $route.path === '/create-request' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 2v16M2 10h16" />
          </svg>
          Создать запрос
        </router-link>
        <router-link
          v-if="isUser"
          to="/my-requests"
          class="nav-item"
          :class="{ active: $route.path === '/my-requests' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          Мои заявки
        </router-link>
        <router-link
          v-if="isCoordinator"
          to="/requests"
          class="nav-item"
          :class="{ active: $route.path === '/requests' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          Заявки
        </router-link>
        <router-link
          v-if="isCoordinator"
          to="/volunteers"
          class="nav-item"
          :class="{ active: $route.path === '/volunteers' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="5" r="4" />
          </svg>
          Волонтёры
        </router-link>
        <router-link
          v-if="isCoordinator"
          to="/incidents"
          class="nav-item"
          :class="{ active: $route.path === '/incidents' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          Инциденты
        </router-link>
        <router-link
          v-if="isVolunteer"
          to="/tasks"
          class="nav-item"
          :class="{ active: $route.path === '/tasks' }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2z" />
          </svg>
          Мои задачи
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ active: $route.path === '/profile' }" @click="sidebarOpen = false">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="10" cy="7" r="4" />
            <path d="M3 20c0-4 3-7 7-7s7 3 7 7" />
          </svg>
          Профиль
        </router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="nav-item"
          :class="{ active: $route.path.startsWith('/admin') }"
          @click="sidebarOpen = false"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 4h14M3 10h14M3 16h14" />
          </svg>
          Админка
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <a href="#" class="nav-item" @click.prevent="logout">Выйти</a>
      </div>
    </aside>

    <main class="main-content" :class="{ 'main-content--full-bleed': $route.path === '/map' }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

const role = computed(() => (authStore.user?.role || '').toUpperCase())
const isCoordinator = computed(() => role.value === 'COORDINATOR' || role.value === 'ADMIN')
const isVolunteer = computed(() => role.value === 'VOLUNTEER')
const isUser = computed(() => role.value === 'USER')
const canCreateRequest = computed(() => role.value === 'USER' || isCoordinator.value)

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
