<template>
  <section id="about" class="cta">
    <div class="container">
      <div class="cta-content">
        <h2>Готовы помочь или получить помощь?</h2>
        <p>Присоединяйтесь к платформе и станьте частью системы спасения</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn btn-white btn-lg">Начать сейчас</router-link>
          <router-link :to="{ path: '/', hash: '#features' }" class="btn btn-outline-white btn-lg"
            >Узнать больше</router-link
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup></script>
