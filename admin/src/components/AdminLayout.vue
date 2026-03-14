<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/">Disaster Admin</router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">Обзор</router-link>
        <router-link to="/users" class="nav-item" :class="{ active: $route.path.startsWith('/users') }">Пользователи</router-link>
        <router-link to="/requests" class="nav-item" :class="{ active: $route.path.startsWith('/requests') }">Заявки</router-link>
        <router-link to="/incidents" class="nav-item" :class="{ active: $route.path.startsWith('/incidents') }">Инциденты</router-link>
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
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
