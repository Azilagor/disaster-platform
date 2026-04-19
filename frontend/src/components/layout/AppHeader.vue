<template>
  <header class="header">
    <div class="container">
      <nav class="nav">
        <router-link to="/" class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z"
              fill="#2563EB"
            />
            <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span class="logo-text">{{ $t('brand.name') }}</span>
        </router-link>
        <ul class="nav-menu">
          <li><router-link :to="{ path: '/', hash: '#features' }">{{ $t('nav.features') }}</router-link></li>
          <li>
            <router-link :to="{ path: '/', hash: '#how-it-works' }">{{ $t('nav.howItWorks') }}</router-link>
          </li>
          <li><router-link :to="{ path: '/', hash: '#about' }">{{ $t('nav.about') }}</router-link></li>
        </ul>
        <div class="nav-actions">
          <LanguageSwitcher class="lang-in-header" />
          <template v-if="authStore.isAuthenticated">
            <router-link to="/profile" class="user-menu-link">
              <img
                v-if="authStore.userAvatar"
                :src="authStore.userAvatar"
                alt=""
                class="user-avatar"
                width="32"
                height="32"
              />
              <span class="user-name">{{ authStore.userName }}</span>
            </router-link>
            <router-link to="/profile" class="btn btn-secondary">{{ $t('nav.profile') }}</router-link>
            <button
              type="button"
              class="btn btn-secondary"
              @click="authStore.logout(); $router.push('/')"
            >
              {{ $t('nav.logout') }}
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-secondary">{{ $t('nav.login') }}</router-link>
            <router-link to="/register" class="btn btn-primary">{{ $t('nav.register') }}</router-link>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js'
import LanguageSwitcher from '../LanguageSwitcher.vue'

const authStore = useAuthStore()
</script>

<style scoped>
.lang-in-header {
  margin-right: 0.25rem;
}
.user-menu-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--gray-700);
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-lg);
  transition: var(--transition);
}
.user-menu-link:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}
.user-avatar {
  border-radius: 50%;
}
.user-name {
  font-size: var(--font-size-sm);
}
</style>
