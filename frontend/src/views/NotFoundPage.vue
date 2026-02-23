<template>
  <div class="not-found">
    <h1>Страница не найдена</h1>
    <p>Запрашиваемая страница не существует или была перемещена.</p>
    <router-link to="/" class="link-home">На главную</router-link>
  </div>
</template>

<script setup></script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.not-found h1 {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  color: var(--text-primary, #1a1a1a);
}

.not-found p {
  margin: 0 0 1.5rem;
  color: var(--text-secondary, #666);
}

.link-home {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--primary, #2563eb);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.link-home:hover {
  background: var(--primary-hover, #1d4ed8);
}
</style>
