<template>
  <header class="header">
    <div class="container">
      <nav class="nav">
        <router-link to="/" class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z" fill="#2563EB"/>
            <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>DisasterHelp</span>
        </router-link>
        <ul class="nav-menu">
          <li><a href="#features">Возможности</a></li>
          <li><a href="#how-it-works">Как это работает</a></li>
          <li><a href="#about">О платформе</a></li>
        </ul>
        <div class="nav-actions">
          <router-link to="/login" class="btn btn-secondary">Вход</router-link>
          <router-link to="/login" class="btn btn-primary">Регистрация</router-link>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
</script>
