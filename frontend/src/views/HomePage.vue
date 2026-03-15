<template>
  <div>
    <AppHeader />

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            Быстрая координация помощи<br />
            <span class="gradient-text">при чрезвычайных ситуациях</span>
          </h1>
          <p class="hero-description">
            Централизованная платформа для сбора запросов о помощи, распределения волонтёров и
            контроля оказания помощи в условиях ЧС
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
              Создать запрос о помощи
            </router-link>
            <router-link to="/login" class="btn btn-outline btn-lg"> Стать волонтёром </router-link>
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
                <path
                  d="M8 2L2 6V10C2 13.866 4.634 16 8 17C11.366 16 14 13.866 14 10V6L8 2Z"
                  fill="currentColor"
                />
              </svg>
              Срочно
            </div>
            <h3>Требуется медицинская помощь</h3>
            <p class="card-location">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1C4.79 1 3 2.79 3 5C3 8.25 7 13 7 13C7 13 11 8.25 11 5C11 2.79 9.21 1 7 1Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle cx="7" cy="5" r="1.5" stroke="currentColor" stroke-width="1.5" />
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

    <!-- CTA Section (скрыта для авторизованных) -->
    <CTASection v-if="!authStore.isAuthenticated" />


    <!-- Погода и Новости ЧС -->
    <section class="info-strip">
      <div class="container">
        <div class="info-strip__grid">

          <!-- Погода -->
          <div class="weather-widget">
            <div class="weather-widget__header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>Погода в Алматы</span>
            </div>
            <div v-if="weatherLoading" class="weather-widget__skeleton"></div>
            <div v-else-if="weather" class="weather-widget__body">
              <img v-if="weather.icon" :src="weather.icon" :alt="weather.description" class="weather-widget__icon" />
              <div class="weather-widget__temp">{{ weather.temp }}°C</div>
              <div class="weather-widget__desc">{{ weather.description }}</div>
              <div class="weather-widget__details">
                <span>Ощущается: {{ weather.feelsLike }}°C</span>
                <span>Влажность: {{ weather.humidity }}%</span>
                <span>Ветер: {{ weather.windSpeed }} м/с</span>
              </div>
            </div>
            <div v-else class="weather-widget__unavailable">Данные недоступны</div>
          </div>

          <!-- Новости ЧС -->
          <div class="news-widget">
            <div class="news-widget__header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/>
                <path d="M16 2v4H8V2"/>
              </svg>
              <span>Новости ЧС — Tengrinews</span>
            </div>

            <div v-if="newsLoading" class="news-widget__list">
              <div v-for="i in 4" :key="i" class="news-card news-card--skeleton"></div>
            </div>

            <div v-else-if="news.length" class="news-widget__list">
              <a
                v-for="item in news"
                :key="item.id"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="news-card"
              >
                <div v-if="item.imageUrl" class="news-card__img-wrap">
                  <img :src="item.imageUrl" :alt="item.title" class="news-card__img" loading="lazy" />
                </div>
                <div class="news-card__body">
                  <div class="news-card__date">{{ formatDate(item.publishedAt || item.createdAt) }}</div>
                  <div class="news-card__title">{{ item.title }}</div>
                  <div v-if="item.description" class="news-card__desc">{{ item.description }}</div>
                </div>
              </a>
            </div>

            <div v-else class="news-widget__empty">
              Нет новостей. <button class="btn-link" @click="refreshNews">Обновить</button>
            </div>
          </div>

        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import AppHeader from '../components/layout/AppHeader.vue'
import AppFooter from '../components/layout/AppFooter.vue'
import FeaturesSection from '../components/sections/FeaturesSection.vue'
import HowItWorksSection from '../components/sections/HowItWorksSection.vue'
import CTASection from '../components/sections/CTASection.vue'
import { API_BASE_URL } from '../api/config.js'

const authStore = useAuthStore()

// ── Погода ────────────────────────────────────────────────────
const weather = ref(null)
const weatherLoading = ref(true)

async function fetchWeather() {
  try {
    const res = await fetch(`${API_BASE_URL}/weather`)
    if (res.ok) weather.value = await res.json()
  } catch {
    // Молча — виджет покажет "недоступно"
  } finally {
    weatherLoading.value = false
  }
}

// ── Новости ───────────────────────────────────────────────────
const news = ref([])
const newsLoading = ref(true)

async function fetchNews() {
  try {
    const res = await fetch(`${API_BASE_URL}/news?limit=6`)
    if (res.ok) {
      const data = await res.json()
      news.value = data.items ?? []
    }
  } catch {
    news.value = []
  } finally {
    newsLoading.value = false
  }
}

async function refreshNews() {
  newsLoading.value = true
  try {
    await fetch(`${API_BASE_URL}/news/refresh`, { method: 'POST' })
    await fetchNews()
  } catch {
    newsLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch {
    return ''
  }
}

onMounted(() => {
  fetchWeather()
  fetchNews()
})
</script>

<style scoped>
/* ── Info strip (погода + новости) ─────────────────────────── */
.info-strip {
  padding: 3rem 0;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}
.info-strip__grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 768px) {
  .info-strip__grid { grid-template-columns: 1fr; }
}

/* ── Виджет погоды ──────────────────────────────────────────── */
.weather-widget {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.weather-widget__header {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-weight: 600;
  font-size: .95rem;
  color: #374151;
  margin-bottom: 1rem;
}
.weather-widget__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
  text-align: center;
}
.weather-widget__icon { width: 64px; height: 64px; }
.weather-widget__temp { font-size: 2.25rem; font-weight: 700; color: #1d4ed8; }
.weather-widget__desc { font-size: .9rem; color: #6b7280; text-transform: capitalize; }
.weather-widget__details {
  display: flex;
  flex-direction: column;
  gap: .15rem;
  font-size: .8rem;
  color: #9ca3af;
  margin-top: .5rem;
}
.weather-widget__skeleton {
  height: 140px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 10px;
}
.weather-widget__unavailable { text-align: center; color: #9ca3af; font-size: .9rem; padding: 1rem 0; }

/* ── Виджет новостей ────────────────────────────────────────── */
.news-widget__header {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-weight: 600;
  font-size: .95rem;
  color: #374151;
  margin-bottom: 1rem;
}
.news-widget__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.news-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow .2s, transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.news-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  transform: translateY(-2px);
}
.news-card--skeleton {
  min-height: 180px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.news-card__img-wrap { width: 100%; height: 140px; overflow: hidden; background: #f3f4f6; }
.news-card__img { width: 100%; height: 100%; object-fit: cover; display: block; }
.news-card__body { padding: .75rem; display: flex; flex-direction: column; gap: .3rem; flex: 1; }
.news-card__date { font-size: .75rem; color: #9ca3af; }
.news-card__title {
  font-size: .88rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-card__desc {
  font-size: .78rem;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-widget__empty { color: #9ca3af; font-size: .9rem; padding: 1rem 0; }
.btn-link { background: none; border: none; color: #2563eb; cursor: pointer; text-decoration: underline; font-size: inherit; padding: 0; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>