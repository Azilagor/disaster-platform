<template>
  <div>
    <div style="margin-bottom: var(--spacing-lg);">
      <router-link to="/incidents" class="btn btn-secondary">← К списку</router-link>
    </div>
    <div class="card">
      <h1 class="page-title">Новый инцидент</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Заголовок *</label>
          <input v-model="form.title" class="form-control" required minlength="5" maxlength="200" placeholder="От 5 до 200 символов" />
          <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
        </div>
        <div class="form-group">
          <label>Описание *</label>
          <textarea v-model="form.description" class="form-control" rows="4" required minlength="20" placeholder="Минимум 20 символов"></textarea>
          <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
        </div>
        <div class="form-group">
          <label>Уровень *</label>
          <select v-model="form.severity" class="form-control" required>
            <option value="">Выберите</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <div class="form-group">
          <label>Район *</label>
          <select v-model="form.district" class="form-control" required>
            <option value="">Выберите</option>
            <option value="ALMALYNSKIY">ALMALYNSKIY</option>
            <option value="AUEZOVSKIY">AUEZOVSKIY</option>
            <option value="BOSTANDYQ">BOSTANDYQ</option>
            <option value="MEDEU">MEDEU</option>
            <option value="NAURYZBAY">NAURYZBAY</option>
            <option value="TURKSIB">TURKSIB</option>
            <option value="ZHETYSU">ZHETYSU</option>
            <option value="ALATAU">ALATAU</option>
          </select>
        </div>
        <div v-if="message" class="form-error mt-md">{{ message }}</div>
        <div class="mt-md">
          <button type="submit" class="btn btn-primary" :disabled="saving">Создать</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createIncident } from '../api/incidents.js'

const router = useRouter()
const saving = ref(false)
const message = ref('')
const form = reactive({
  title: '',
  description: '',
  severity: '',
  district: '',
})
const errors = reactive({ title: '', description: '' })

function validate() {
  errors.title = ''
  errors.description = ''
  const t = form.title?.trim() || ''
  const d = form.description?.trim() || ''
  if (t.length < 5 || t.length > 200) errors.title = 'Заголовок: от 5 до 200 символов'
  if (d.length < 20) errors.description = 'Описание: минимум 20 символов'
  return !errors.title && !errors.description
}

async function submit() {
  message.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const data = await createIncident({
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      district: form.district,
    })
    router.push(`/incidents/${data.incident?.id ?? ''}`)
  } catch (e) {
    message.value = e.message || 'Ошибка создания'
  } finally {
    saving.value = false
  }
}
</script>
