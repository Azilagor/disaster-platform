# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Тесты

- **Unit-тесты (Vitest):** тесты для `src/utils/validation.js` и при появлении — для composables.
  - Запуск: `npm run test` (watch) или `npm run test:run` (один прогон).
- **E2E (Playwright):** сценарий по критичному флоу: логин → создание запроса о помощи → редирект на карту (API в тесте замоканы).
  - Перед запуском поднимите приложение: `npm run dev`.
  - Запуск: `npm run test:e2e` или `npm run test:e2e:ui`.
  - Установка браузеров (один раз): `npx playwright install`.
