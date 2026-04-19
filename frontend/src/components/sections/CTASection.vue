<template>
  <section id="about" class="cta">
    <div class="container">
      <div class="cta-content">
        <h2>{{ $t('cta.title') }}</h2>
        <p>{{ $t('cta.subtitle') }}</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn btn-white btn-lg">{{ $t('cta.start') }}</router-link>
          <router-link :to="{ path: '/', hash: '#features' }" class="btn btn-outline-white btn-lg">{{
            $t('cta.learnMore')
          }}</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup></script>
