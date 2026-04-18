<template>
  <section id="features" class="features">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ $t('features.sectionTitle') }}</h2>
        <p class="section-description">
          {{ $t('features.sectionDesc') }}
        </p>
      </div>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div :class="`feature-icon ${feature.iconClass}`">
            <div v-html="feature.icon"></div>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const features = computed(() => [
  {
    title: t('features.f1t'),
    description: t('features.f1d'),
    iconClass: 'icon-blue',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7V12C2 17.55 6.84 22.74 12 24C17.16 22.74 22 17.55 22 12V7L12 2Z" stroke="currentColor" stroke-width="2"/></svg>',
  },
  {
    title: t('features.f2t'),
    description: t('features.f2d'),
    iconClass: 'icon-green',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="2"/></svg>',
  },
  {
    title: t('features.f3t'),
    description: t('features.f3d'),
    iconClass: 'icon-purple',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  },
  {
    title: t('features.f4t'),
    description: t('features.f4d'),
    iconClass: 'icon-orange',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>',
  },
  {
    title: t('features.f5t'),
    description: t('features.f5d'),
    iconClass: 'icon-red',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2"/></svg>',
  },
  {
    title: t('features.f6t'),
    description: t('features.f6d'),
    iconClass: 'icon-teal',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  },
])
</script>
