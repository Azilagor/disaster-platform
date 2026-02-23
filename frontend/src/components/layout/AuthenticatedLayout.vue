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
          <span class="badge">3</span>
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
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
