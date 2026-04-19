<template>
  <div>
    <AppHeader />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            {{ $t('home.heroLine1') }}<br />
            <span class="gradient-text">{{ $t('home.heroLine2') }}</span>
          </h1>
          <p class="hero-description">
            {{ $t('home.heroDescription') }}
          </p>
          <div class="hero-buttons">
            <router-link to="/create-request" class="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2V18M2 10H18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              {{ $t('home.createHelp') }}
            </router-link>
            <router-link to="/login" class="btn btn-outline btn-lg">{{ $t('home.becomeVolunteer') }}</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">1,247</div>
              <div class="stat-label">{{ $t('home.statActive') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">3,890</div>
              <div class="stat-label">{{ $t('home.statVolunteers') }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">12,456</div>
              <div class="stat-label">{{ $t('home.statHelped') }}</div>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-card card-floating">
            <div class="emergency-badge badge-urgent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L2 6V10C2 13.866 4.634 16 8 17C11.366 16 14 13.866 14 10V6L8 2Z"
                  fill="currentColor"
                />
              </svg>
              {{ $t('home.urgent') }}
            </div>
            <h3>{{ $t('home.demoCardTitle') }}</h3>
            <p class="card-location">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13C7 13 11 8.25 11 5C11 2.79 9.21 1 7 1Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle cx="7" cy="5" r="1.5" stroke="currentColor" stroke-width="1.5" />
              </svg>
              {{ $t('home.demoLocation') }}
            </p>
            <div class="card-footer">
              <span class="time">{{ $t('home.minsAgo', { n: 15 }) }}</span>
              <span class="status status-new">{{ $t('home.statusNew') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <FeaturesSection />

    <!-- How it works Section -->
    <HowItWorksSection />

    <!-- CTA Section (скрыта для авторизованных) -->
    <CTASection v-if="!authStore.isAuthenticated" />

    <AppFooter />
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppFooter from '../components/layout/AppFooter.vue'
import FeaturesSection from '../components/sections/FeaturesSection.vue'
import HowItWorksSection from '../components/sections/HowItWorksSection.vue'
import CTASection from '../components/sections/CTASection.vue'

const authStore = useAuthStore()
</script>
