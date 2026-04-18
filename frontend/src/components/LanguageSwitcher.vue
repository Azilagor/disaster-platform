<template>
  <div class="lang-switcher">
    <label class="sr-only" for="locale-select">{{ $t('common.language') }}</label>
    <select
      id="locale-select"
      class="lang-select"
      :value="locale"
      @change="onChange($event.target.value)"
    >
      <option value="ru">{{ $t('locale.ru') }}</option>
      <option value="en">{{ $t('locale.en') }}</option>
      <option value="kk">{{ $t('locale.kk') }}</option>
    </select>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { persistLocale } from '../i18n.js'

const { locale } = useI18n()

function onChange(value) {
  locale.value = value
  persistLocale(value)
}
</script>

<style scoped>
.lang-switcher {
  display: inline-flex;
  align-items: center;
}
.lang-select {
  font-size: var(--font-size-sm, 0.875rem);
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--gray-300, #d1d5db);
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gray-50, #f9fafb);
  color: var(--gray-800, #1f2937);
  cursor: pointer;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
