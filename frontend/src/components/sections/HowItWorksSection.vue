<template>
  <section id="how-it-works" class="how-it-works">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ $t('howItWorks.title') }}</h2>
      </div>
      <div class="steps">
        <div v-for="step in steps" :key="step.number" class="step">
          <div class="step-number">{{ step.number }}</div>
          <div class="step-content">
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const steps = computed(() => [
  {
    number: 1,
    title: t('howItWorks.s1t'),
    description: t('howItWorks.s1d'),
  },
  {
    number: 2,
    title: t('howItWorks.s2t'),
    description: t('howItWorks.s2d'),
  },
  {
    number: 3,
    title: t('howItWorks.s3t'),
    description: t('howItWorks.s3d'),
  },
  {
    number: 4,
    title: t('howItWorks.s4t'),
    description: t('howItWorks.s4d'),
  },
])
</script>
