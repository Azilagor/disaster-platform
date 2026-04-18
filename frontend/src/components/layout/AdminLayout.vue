<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header admin-sidebar-header">
        <LanguageSwitcher />
        <router-link to="/admin" class="logo">{{ $t('adminLayout.title') }}</router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">{{
          $t('adminLayout.overview')
        }}</router-link>
        <router-link to="/admin/users" class="nav-item" :class="{ active: $route.path.startsWith('/admin/users') }">{{
          $t('adminLayout.users')
        }}</router-link>
        <router-link to="/admin/requests" class="nav-item" :class="{ active: $route.path.startsWith('/admin/requests') }">{{
          $t('adminLayout.requests')
        }}</router-link>
        <router-link to="/admin/incidents" class="nav-item" :class="{ active: $route.path.startsWith('/admin/incidents') }">{{
          $t('adminLayout.incidents')
        }}</router-link>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/dashboard" class="nav-item">{{ $t('adminLayout.toSite') }}</router-link>
        <a href="#" class="nav-item" @click.prevent="logout">{{ $t('adminLayout.logout') }}</a>
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
import LanguageSwitcher from '../LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-sidebar-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
</style>
