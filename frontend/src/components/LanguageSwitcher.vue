<template>
  <div class="lang-switch" role="navigation" :aria-label="$t('a11y.languageMenu')">
    <button
      v-for="opt in options"
      :key="opt.code"
      type="button"
      class="lang-switch__btn"
      :class="{ active: locale === opt.code }"
      :aria-pressed="locale === opt.code"
      @click="select(opt.code)"
    >
      {{ opt.short }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'
import { SUPPORTED_LOCALES } from '../i18n/locale.js'

const { locale } = useI18n()

const options = SUPPORTED_LOCALES.map((code) => ({
  code,
  short: code.toUpperCase(),
}))
function select(code) {
  setLocale(code)
}
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.lang-switch__btn {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--gray-200, #e5e7eb);
  background: var(--gray-50, #f9fafb);
  color: var(--gray-700, #374151);
  cursor: pointer;
  line-height: 1;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.lang-switch__btn:hover {
  background: var(--gray-100, #f3f4f6);
  border-color: var(--gray-300, #d1d5db);
}
.lang-switch__btn.active {
  background: var(--primary, #2563eb);
  border-color: var(--primary, #2563eb);
  color: #fff;
}
</style>
