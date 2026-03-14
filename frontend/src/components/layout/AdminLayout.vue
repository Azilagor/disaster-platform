<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/admin" class="logo">Админка</router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">Обзор</router-link>
        <router-link to="/admin/users" class="nav-item" :class="{ active: $route.path.startsWith('/admin/users') }">Пользователи</router-link>
        <router-link to="/admin/requests" class="nav-item" :class="{ active: $route.path.startsWith('/admin/requests') }">Заявки</router-link>
        <router-link to="/admin/incidents" class="nav-item" :class="{ active: $route.path.startsWith('/admin/incidents') }">Инциденты</router-link>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/dashboard" class="nav-item">На главный сайт</router-link>
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
