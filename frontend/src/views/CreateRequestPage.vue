<template>
  <div class="form-body">
    <AppHeader />
    <main class="form-main">
      <div class="container form-wrapper">
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1 }">
            <div class="step-number">1</div>
            <span class="step-label">Тип помощи</span>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: currentStep >= 2 }">
            <div class="step-number">2</div>
            <span class="step-label">Детали</span>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: currentStep >= 3 }">
            <div class="step-number">3</div>
            <span class="step-label">Контакты</span>
          </div>
        </div>

        <div class="form-content">
          <div class="form-header-section">
            <h1>Создать запрос о помощи</h1>
            <p>
              Опишите ситуацию — волонтёры и координаторы увидят запрос на карте и смогут
              откликнуться.
            </p>
          </div>

          <!-- Step 1: Problem type -->
          <div class="form-step" :class="{ active: currentStep === 1 }">
            <h2 class="step-title">Выберите тип помощи</h2>
            <div class="problem-types">
              <label v-for="type in problemTypes" :key="type.id" class="problem-type-card">
                <input v-model="form.problemType" type="radio" :value="type.id" />
                <div class="card-content">
                  <div class="card-icon" :class="type.iconClass">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M12 18v-6" />
                      <path d="M9 15h6" />
                    </svg>
                  </div>
                  <h3>{{ type.title }}</h3>
                  <p>{{ type.description }}</p>
                </div>
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-primary" @click="currentStep = 2">Далее</button>
            </div>
          </div>

          <!-- Step 2: Details -->
          <div class="form-step" :class="{ active: currentStep === 2 }">
            <h2 class="step-title">Опишите ситуацию</h2>
            <div class="info-box">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v4M10 14h.01" />
              </svg>
              <div>
                <strong>Укажите адрес и что именно требуется</strong>
                <p>Чем точнее описание, тем быстрее найдётся помощь.</p>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="address">Адрес</label>
                <input
                  id="address"
                  v-model="form.address"
                  type="text"
                  class="form-control"
                  placeholder="г. Алматы, ул. Абая, 150"
                />
              </div>
              <div class="form-group full-width">
                <label for="description">Описание</label>
                <textarea
                  id="description"
                  v-model="form.description"
                  class="form-control"
                  placeholder="Опишите, что нужно: количество людей, особые условия, срочность..."
                  rows="4"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="priority">Приоритет</label>
                <select id="priority" v-model="form.priority" class="form-control">
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="critical">Критический</option>
                </select>
              </div>
              <div class="form-group">
                <label for="people">Количество людей</label>
                <input
                  id="people"
                  v-model.number="form.peopleCount"
                  type="number"
                  class="form-control"
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="currentStep = 1">
                Назад
              </button>
              <button type="button" class="btn btn-primary" @click="currentStep = 3">Далее</button>
            </div>
          </div>

          <!-- Step 3: Contacts -->
          <div class="form-step" :class="{ active: currentStep === 3 }">
            <h2 class="step-title">Контактные данные</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="contactName">Ваше имя</label>
                <input
                  id="contactName"
                  v-model="form.contactName"
                  type="text"
                  class="form-control"
                  placeholder="Иван Иванов"
                />
              </div>
              <div class="form-group">
                <label for="contactPhone">Телефон</label>
                <input
                  id="contactPhone"
                  v-model="form.contactPhone"
                  type="tel"
                  class="form-control"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div class="form-group full-width">
                <label for="contactComment" class="form-hint"
                  >Дополнительно (когда удобно звонить, комментарий)</label
                >
                <textarea
                  id="contactComment"
                  v-model="form.contactComment"
                  class="form-control"
                  rows="2"
                  placeholder="Необязательно"
                ></textarea>
              </div>
            </div>
            <label class="checkbox-label large">
              <input v-model="form.agreeData" type="checkbox" required />
              <span>Я согласен на обработку персональных данных для координации помощи</span>
            </label>
            <div v-if="submitError" class="auth-message auth-message-error">{{ submitError }}</div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="currentStep = 2">
                Назад
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting"
                @click.prevent="submitRequest"
              >
                Отправить запрос
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AppFooter from '../components/layout/AppFooter.vue'
import { createRequest } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'

const router = useRouter()
const currentStep = ref(1)
const submitting = ref(false)
const submitError = ref('')
const form = reactive({
  problemType: '',
  address: '',
  description: '',
  priority: 'medium',
  peopleCount: 1,
  contactName: '',
  contactPhone: '',
  contactComment: '',
  agreeData: false,
})

const problemTypes = [
  {
    id: 'medical',
    title: 'Медицинская помощь',
    description: 'Травмы, лекарства, медикаменты, врачи',
    iconClass: 'medical',
  },
  {
    id: 'food',
    title: 'Питание и вода',
    description: 'Продукты, питьевая вода, детское питание',
    iconClass: 'food',
  },
  {
    id: 'evacuation',
    title: 'Эвакуация',
    description: 'Транспорт, выезд из зоны ЧС',
    iconClass: 'evacuation',
  },
  {
    id: 'shelter',
    title: 'Жильё и ночлег',
    description: 'Временное размещение, одежда',
    iconClass: 'shelter',
  },
  {
    id: 'repair',
    title: 'Ремонт и техника',
    description: 'Электрика, отопление, связь',
    iconClass: 'repair',
  },
  {
    id: 'psychological',
    title: 'Психологическая помощь',
    description: 'Поддержка, консультация',
    iconClass: 'psychological',
  },
]

async function submitRequest() {
  if (!form.agreeData) return
  submitError.value = ''
  submitting.value = true
  try {
    await withLoading(() =>
      createRequest({
        problemType: form.problemType.toUpperCase(),
        address: form.address?.trim() ?? '',
        description: form.description?.trim() ?? '',
        priority: form.priority.toUpperCase(),
        peopleCount: form.peopleCount || 1,
        contactName: form.contactName?.trim() ?? '',
        contactPhone: form.contactPhone?.trim() ?? '',
        contactComment: form.contactComment?.trim() || undefined,
      })
    )
    router.push('/map')
  } catch (error) {
    submitError.value = error.message || 'Не удалось отправить запрос. Попробуйте позже.'
  } finally {
    submitting.value = false
  }
}
</script>
