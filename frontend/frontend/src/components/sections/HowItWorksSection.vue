<template>
  <section id="how-it-works" class="how-it-works">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Как это работает</h2>
      </div>
      <div class="steps">
        <div class="step" v-for="step in steps" :key="step.number">
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
const steps = [
  {
    number: 1,
    title: 'Создание запроса',
    description: 'Пострадавший или очевидец создаёт запрос о помощи с описанием проблемы и местоположением'
  },
  {
    number: 2,
    title: 'Координация',
    description: 'Координатор просматривает запросы на карте и назначает подходящих волонтёров'
  },
  {
    number: 3,
    title: 'Оказание помощи',
    description: 'Волонтёр получает уведомление, прибывает на место и оказывает помощь'
  },
  {
    number: 4,
    title: 'Отчётность',
    description: 'Статус обновляется, помощь отмечается как выполненная, система сохраняет отчёт'
  }
]
</script>
