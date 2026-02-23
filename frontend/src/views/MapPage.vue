<template>
  <div class="map-page">
    <aside class="filters-panel">
      <div class="filters-header">
        <h2>Фильтры</h2>
      </div>
      <div class="filter-group">
        <span class="filter-label">Тип помощи</span>
        <div class="checkbox-group">
          <label v-for="t in filterTypes" :key="t.id" class="checkbox-item">
            <input v-model="t.checked" type="checkbox" />
            <span class="checkbox-text">{{ t.label }}</span>
          </label>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">Статус</span>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input v-model="filterStatusNew" type="checkbox" />
            <span class="checkbox-text"
              ><span class="status-indicator status-new"></span> Новый</span
            >
          </label>
          <label class="checkbox-item">
            <input v-model="filterStatusInProgress" type="checkbox" />
            <span class="checkbox-text"
              ><span class="status-indicator status-in-progress"></span> В работе</span
            >
          </label>
          <label class="checkbox-item">
            <input v-model="filterStatusCompleted" type="checkbox" />
            <span class="checkbox-text"
              ><span class="status-indicator status-completed"></span> Выполнен</span
            >
          </label>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">Приоритет</span>
        <div class="checkbox-group">
          <label v-for="p in filterPriorities" :key="p.id" class="checkbox-item">
            <input v-model="p.checked" type="checkbox" />
            <span class="checkbox-text"
              ><span class="priority-badge" :class="p.id">{{ p.label }}</span></span
            >
          </label>
        </div>
      </div>
      <div class="filter-stats">
        <div class="filter-stat-item">
          <strong>{{ requests.length }}</strong>
          <span>запросов на карте</span>
        </div>
      </div>
    </aside>

    <div class="map-container">
      <div class="map-header">
        <div class="search-box">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Поиск по адресу или описанию..." />
        </div>
        <router-link to="/create-request" class="btn btn-primary">Создать запрос</router-link>
      </div>
      <div class="map-placeholder">
        <div class="map-overlay">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>Карта запросов</p>
          <p class="map-note">
            Здесь будет отображаться интерактивная карта с маркерами запросов. Подключите карту
            (Leaflet, Yandex.Maps или др.) для отображения точек.
          </p>
        </div>
      </div>
      <div class="map-legend">
        <h4>Приоритет</h4>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-marker critical-marker"></span><span>Критический</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker high-marker"></span><span>Высокий</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker medium-marker"></span><span>Средний</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker low-marker"></span><span>Низкий</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: request detail -->
    <div v-if="selectedRequest" class="modal" @click.self="selectedRequest = null">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Запрос #{{ selectedRequest.id }}</h2>
          <button
            type="button"
            class="modal-close"
            aria-label="Закрыть"
            @click="selectedRequest = null"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 2L2 18M2 2l16 16" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="request-detail-header">
            <span class="priority-badge" :class="selectedRequest.priority">{{
              selectedRequest.priorityLabel
            }}</span>
            <span class="status-indicator" :class="'status-' + selectedRequest.status"></span>
          </div>
          <h3>{{ selectedRequest.title }}</h3>
          <div class="detail-section">
            <h4>Адрес</h4>
            <p>{{ selectedRequest.location }}</p>
          </div>
          <div class="detail-section">
            <h4>Описание</h4>
            <p>{{ selectedRequest.description }}</p>
          </div>
          <div class="detail-section">
            <h4>Контакт</h4>
            <p>{{ selectedRequest.contact }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="selectedRequest = null">
            Закрыть
          </button>
          <button type="button" class="btn btn-primary">Откликнуться</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const searchQuery = ref('')
const filterStatusNew = ref(true)
const filterStatusInProgress = ref(true)
const filterStatusCompleted = ref(false)
const filterTypes = ref([
  { id: 'medical', label: 'Медицина', checked: true },
  { id: 'food', label: 'Питание', checked: true },
  { id: 'evacuation', label: 'Эвакуация', checked: true },
  { id: 'shelter', label: 'Жильё', checked: true },
])
const filterPriorities = ref([
  { id: 'critical', label: 'Критический', checked: true },
  { id: 'high', label: 'Высокий', checked: true },
  { id: 'medium', label: 'Средний', checked: true },
  { id: 'low', label: 'Низкий', checked: true },
])

const requests = ref([
  {
    id: 1247,
    title: 'Требуется медицинская помощь',
    location: 'г. Алматы, ул. Абая, 150',
    description: 'Пожилой человек, нужны лекарства и осмотр.',
    contact: '+7 777 123-45-67',
    priority: 'critical',
    priorityLabel: 'Критический',
    status: 'new',
  },
  {
    id: 1248,
    title: 'Нужна эвакуация',
    location: 'г. Алматы, мкр. Самал-2',
    description: 'Семья из 4 человек, есть дети.',
    contact: '+7 701 234-56-78',
    priority: 'high',
    priorityLabel: 'Высокий',
    status: 'in-progress',
  },
  {
    id: 1249,
    title: 'Продукты и вода',
    location: 'г. Алматы, ул. Толе би, 59',
    description: '2 взрослых, нужны продукты на 3 дня.',
    contact: '+7 705 345-67-89',
    priority: 'medium',
    priorityLabel: 'Средний',
    status: 'new',
  },
])

const selectedRequest = ref(null)

onMounted(() => {
  const id = route.query.request
  if (id) {
    const r = requests.value.find((req) => String(req.id) === String(id))
    if (r) selectedRequest.value = r
  }
})
</script>
