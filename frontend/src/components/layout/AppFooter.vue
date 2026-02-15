<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-col">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L4 9V16C4 23.732 9.268 28 16 30C22.732 28 28 23.732 28 16V9L16 2Z" fill="#2563EB"/>
              <path d="M16 10V22M10 16H22" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>DisasterHelp</span>
          </div>
          <p>Платформа координации помощи при чрезвычайных ситуациях</p>
        </div>
        <div class="footer-col">
          <h4>Платформа</h4>
          <ul>
            <li><a href="#features">Возможности</a></li>
            <li><a href="#how-it-works">Как работает</a></li>
            <li><router-link to="/login">Регистрация</router-link></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Роли</h4>
          <ul>
            <li><a href="#">Для пользователей</a></li>
            <li><a href="#">Для волонтёров</a></li>
            <li><a href="#">Для координаторов</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Контакты</h4>
          <ul>
            <li><a href="mailto:help@disasterhelp.kz">help@disasterhelp.kz</a></li>
            <li><a href="tel:+77273123456">+7 (727) 312-34-56</a></li>
            <li>г. Алматы, Казахстан</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 DisasterHelp. Все права защищены.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>
