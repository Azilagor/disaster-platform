<template>
  <div class="form-body">
    <AppHeader />
    <main class="form-main">
      <div class="container form-wrapper">
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1 }">
            <div class="step-number">1</div>
            <span class="step-label">{{ $t('createRequest.step1') }}</span>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: currentStep >= 2 }">
            <div class="step-number">2</div>
            <span class="step-label">{{ $t('createRequest.step2') }}</span>
          </div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: currentStep >= 3 }">
            <div class="step-number">3</div>
            <span class="step-label">{{ $t('createRequest.step3') }}</span>
          </div>
        </div>

        <div class="form-content">
          <div class="form-header-section">
            <h1>{{ $t('createRequest.pageTitle') }}</h1>
            <p>
              {{ $t('createRequest.pageSubtitle') }}
            </p>
          </div>

          <div class="form-step" :class="{ active: currentStep === 1 }">
            <h2 class="step-title">{{ $t('createRequest.chooseType') }}</h2>
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
            <div v-if="formErrors.problemType" class="invalid-feedback d-block mb-2">{{ tr(formErrors.problemType) }}</div>
            <div class="form-actions">
              <button type="button" class="btn btn-primary" @click="currentStep = 2">{{ $t('createRequest.next') }}</button>
            </div>
          </div>

          <div class="form-step" :class="{ active: currentStep === 2 }">
            <h2 class="step-title">{{ $t('createRequest.describe') }}</h2>
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
                <strong>{{ $t('createRequest.infoTitle') }}</strong>
                <p>{{ $t('createRequest.infoText') }}</p>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="title">{{ $t('createRequest.requestTitle') }}</label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.title }"
                  :placeholder="$t('createRequest.titlePlaceholder')"
                />
                <div v-if="formErrors.title" class="invalid-feedback">{{ tr(formErrors.title) }}</div>
              </div>
              <div class="form-group full-width">
                <label for="address">{{ $t('common.address') }}</label>
                <input
                  id="address"
                  v-model="form.address"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.address }"
                  :placeholder="$t('createRequest.addressPlaceholder')"
                />
                <div v-if="formErrors.address" class="invalid-feedback">{{ tr(formErrors.address) }}</div>
              </div>
              <div class="form-group">
                <label for="district">{{ $t('common.district') }}</label>
                <select id="district" v-model="form.district" class="form-control" :class="{ 'is-invalid': formErrors.district }">
                  <option value="">{{ $t('createRequest.selectDistrict') }}</option>
                  <option v-for="code in districtOptions" :key="code" :value="code">
                    {{ $t('enums.district.' + code) }}
                  </option>
                </select>
                <div v-if="formErrors.district" class="invalid-feedback">{{ tr(formErrors.district) }}</div>
              </div>
              <div class="form-group">
                <label for="priority">{{ $t('common.priority') }}</label>
                <select id="priority" v-model="form.priority" class="form-control">
                  <option v-for="code in priorityOptions" :key="code" :value="code">
                    {{ $t('enums.priority.' + code) }}
                  </option>
                </select>
              </div>
              <div class="form-group full-width">
                <label for="description">{{ $t('common.description') }}</label>
                <textarea
                  id="description"
                  v-model="form.description"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.description }"
                  :placeholder="$t('createRequest.descriptionPlaceholder')"
                  rows="4"
                ></textarea>
                <div v-if="formErrors.description" class="invalid-feedback">{{ tr(formErrors.description) }}</div>
              </div>
              <div class="form-group">
                <label for="people">{{ $t('common.peopleCount') }}</label>
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
                {{ $t('createRequest.back') }}
              </button>
              <button type="button" class="btn btn-primary" @click="currentStep = 3">{{ $t('createRequest.next') }}</button>
            </div>
          </div>

          <div class="form-step" :class="{ active: currentStep === 3 }">
            <h2 class="step-title">{{ $t('createRequest.contactsTitle') }}</h2>
            <div class="form-grid">
              <div class="form-group">
                <label for="contactName">{{ $t('createRequest.yourName') }}</label>
                <input
                  id="contactName"
                  v-model="form.contactName"
                  type="text"
                  class="form-control"
                  :placeholder="$t('createRequest.namePlaceholder')"
                />
              </div>
              <div class="form-group">
                <label for="contactPhone">{{ $t('common.phone') }}</label>
                <input
                  id="contactPhone"
                  v-model="form.contactPhone"
                  type="tel"
                  class="form-control"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div class="form-group full-width">
                <label for="contactComment" class="form-hint">{{ $t('createRequest.commentLabel') }}</label>
                <textarea
                  id="contactComment"
                  v-model="form.contactComment"
                  class="form-control"
                  rows="2"
                  :placeholder="$t('common.optional')"
                ></textarea>
              </div>
            </div>
            <label class="checkbox-label large">
              <input v-model="form.agreeData" type="checkbox" required />
              <span>{{ $t('auth.agreeDataProcessing') }}</span>
            </label>
            <div v-if="submitError" class="auth-message auth-message-error">{{ tr(submitError) }}</div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="currentStep = 2">
                {{ $t('createRequest.back') }}
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="submitting"
                @click.prevent="submitRequest"
              >
                {{ $t('createRequest.submit') }}
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '../components/layout/AppHeader.vue'
import AppFooter from '../components/layout/AppFooter.vue'
import { createRequest } from '../api/requests.js'
import { withLoading } from '../stores/loading.js'
import { ALLOWED_PRIORITIES, ALLOWED_DISTRICTS } from '../constants/requests.js'
import {
  validateProblemType,
  validateRequestTitle,
  validateRequestDescription,
  validateDistrict,
  validatePriority,
  validateRequiredAddress,
} from '../utils/validation.js'

const { t, te } = useI18n()

function tr(code) {
  if (!code) return ''
  return te(code) ? t(code) : code
}

const router = useRouter()
const currentStep = ref(1)
const submitting = ref(false)
const submitError = ref('')
const form = reactive({
  problemType: '',
  title: '',
  address: '',
  district: '',
  description: '',
  priority: 'MEDIUM',
  peopleCount: 1,
  contactName: '',
  contactPhone: '',
  contactComment: '',
  agreeData: false,
})

const formErrors = reactive({
  problemType: '',
  title: '',
  address: '',
  district: '',
  description: '',
})

const problemTypes = computed(() => {
  const ids = ['MEDICAL', 'FOOD', 'EVACUATION', 'SHELTER', 'REPAIR', 'PSYCHOLOGICAL']
  const descKeys = [
    'problemDescMedical',
    'problemDescFood',
    'problemDescEvacuation',
    'problemDescShelter',
    'problemDescRepair',
    'problemDescPsychological',
  ]
  const iconClasses = ['medical', 'food', 'evacuation', 'shelter', 'repair', 'psychological']
  return ids.map((id, i) => ({
    id,
    title: t('enums.problemType.' + id),
    description: t('createRequest.' + descKeys[i]),
    iconClass: iconClasses[i],
  }))
})

const priorityOptions = ALLOWED_PRIORITIES
const districtOptions = ALLOWED_DISTRICTS

function validateForm() {
  formErrors.problemType = validateProblemType(form.problemType) || ''
  formErrors.title = validateRequestTitle(form.title) || ''
  formErrors.description = validateRequestDescription(form.description) || ''
  formErrors.district = validateDistrict(form.district) || ''
  formErrors.address = validateRequiredAddress(form.address) || ''
  const pr = validatePriority(form.priority)
  const valid =
    !formErrors.problemType &&
    !formErrors.title &&
    !formErrors.description &&
    !formErrors.district &&
    !formErrors.address &&
    !pr
  if (!valid && formErrors.problemType) currentStep.value = 1
  else if (!valid) currentStep.value = 2
  return valid
}

async function submitRequest() {
  if (!form.agreeData) return
  submitError.value = ''
  if (!validateForm()) return
  submitting.value = true
  try {
    const { request: created } = await withLoading(() =>
      createRequest({
        problemType: form.problemType,
        title: form.title?.trim() ?? '',
        description: form.description?.trim() ?? '',
        priority: form.priority,
        address: form.address?.trim() ?? '',
        district: form.district,
        peopleCount: form.peopleCount || 1,
        contactName: form.contactName?.trim() ?? '',
        contactPhone: form.contactPhone?.trim() ?? '',
        contactComment: form.contactComment?.trim() || undefined,
      })
    )
    if (created?.id != null) {
      router.push({ path: '/map', query: { request: String(created.id) } })
    } else {
      router.push('/map')
    }
  } catch (error) {
    submitError.value = error.message || 'createRequest.submitError'
  } finally {
    submitting.value = false
  }
}
</script>
