<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <router-link to="/admin" class="logo">{{ $t('nav.admin') }}</router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">{{ $t('nav.adminOverview') }}</router-link>
        <router-link to="/admin/users" class="nav-item" :class="{ active: $route.path.startsWith('/admin/users') }">{{ $t('nav.adminUsers') }}</router-link>
        <router-link to="/admin/requests" class="nav-item" :class="{ active: $route.path.startsWith('/admin/requests') }">{{ $t('nav.adminRequests') }}</router-link>
        <router-link to="/admin/incidents" class="nav-item" :class="{ active: $route.path.startsWith('/admin/incidents') }">{{ $t('nav.adminIncidents') }}</router-link>
      </nav>
      <div class="sidebar-footer sidebar-footer-lang">
        <LanguageSwitcher />
        <router-link to="/dashboard" class="nav-item">{{ $t('nav.mainSite') }}</router-link>
        <a href="#" class="nav-item" @click.prevent="logout">{{ $t('nav.logout') }}</a>
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
