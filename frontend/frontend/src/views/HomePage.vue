<template>
  <div>
    <AppHeader />
    
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            Быстрая координация помощи<br>
            <span class="gradient-text">при чрезвычайных ситуациях</span>
          </h1>
          <p class="hero-description">
            Централизованная платформа для сбора запросов о помощи, 
            распределения волонтёров и контроля оказания помощи в условиях ЧС
          </p>
          <div class="hero-buttons">
            <router-link to="/create-request" class="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2V18M2 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Создать запрос о помощи
            </router-link>
            <router-link to="/login" class="btn btn-outline btn-lg">
              Стать волонтёром
            </router-link>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">1,247</div>
              <div class="stat-label">Активных запросов</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">3,890</div>
              <div class="stat-label">Волонтёров</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">12,456</div>
              <div class="stat-label">Оказано помощи</div>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-card card-floating">
            <div class="emergency-badge badge-urgent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L2 6V10C2 13.866 4.634 16 8 17C11.366 16 14 13.866 14 10V6L8 2Z" fill="currentColor"/>
              </svg>
              Срочно
            </div>
            <h3>Требуется медицинская помощь</h3>
            <p class="card-location">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13C7 13 11 8.25 11 5C11 2.79 9.21 1 7 1Z" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="7" cy="5" r="1.5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              г. Алматы, ул. Абая, 150
            </p>
            <div class="card-footer">
              <span class="time">15 мин назад</span>
              <span class="status status-new">Новый</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <FeaturesSection />

    <!-- How it works Section -->
    <HowItWorksSection />

    <!-- CTA Section -->
    <CTASection />

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/layout/AppHeader.vue'
import AppFooter from '../components/layout/AppFooter.vue'
import FeaturesSection from '../components/sections/FeaturesSection.vue'
import HowItWorksSection from '../components/sections/HowItWorksSection.vue'
import CTASection from '../components/sections/CTASection.vue'
</script>
