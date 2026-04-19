<template>
  <div>
    <div class="back-row"><router-link to="/admin/incidents" class="btn btn-secondary">{{ $t('common.backToList') }}</router-link></div>
    <div class="card">
      <h1 class="page-title">{{ $t('admin.newIncident') }}</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>{{ $t('common.title') }} *</label>
          <input v-model="form.title" class="form-control" required minlength="5" maxlength="200" />
          <span v-if="errors.title" class="form-error">{{ $t(errors.title) }}</span>
        </div>
        <div class="form-group">
          <label>{{ $t('common.description') }} *</label>
          <textarea v-model="form.description" class="form-control" rows="4" required minlength="20"></textarea>
          <span v-if="errors.description" class="form-error">{{ $t(errors.description) }}</span>
        </div>
        <div class="form-group">
          <label>{{ $t('admin.level') }} *</label>
          <select v-model="form.severity" class="form-control" required>
            <option value="">{{ $t('incidents.select') }}</option>
            <option v-for="s in ALLOWED_SEVERITIES" :key="s" :value="s">{{ $t('enums.severity.' + s) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('common.district') }} *</label>
          <select v-model="form.district" class="form-control" required>
            <option value="">{{ $t('incidents.select') }}</option>
            <option v-for="d in ALLOWED_DISTRICTS" :key="d" :value="d">{{ $t('enums.district.' + d) }}</option>
          </select>
        </div>
        <div v-if="message" class="form-error">{{ message }}</div>
        <button type="submit" class="btn btn-primary mt-md" :disabled="saving">{{ $t('incidents.createSubmit') }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createIncident } from '../../api/incidents.js'
import { ALLOWED_SEVERITIES } from '../../constants/incidents.js'
import { ALLOWED_DISTRICTS } from '../../constants/requests.js'

const { t } = useI18n()
const router = useRouter()
const saving = ref(false)
const message = ref('')
const form = reactive({ title: '', description: '', severity: '', district: '' })
const errors = reactive({ title: '', description: '' })

function validate() {
  errors.title = ''
  errors.description = ''
  const ti = form.title?.trim() || ''
  const d = form.description?.trim() || ''
  if (ti.length < 5 || ti.length > 200) errors.title = 'validation.titleLength'
  if (d.length < 20) errors.description = 'validation.incidentDescriptionMin'
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
    router.push(`/admin/incidents/${data.incident?.id ?? ''}`)
  } catch (e) {
    message.value = e.message || t('admin.createIncidentError')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.back-row { margin-bottom: var(--spacing-lg); }
.form-group { margin-bottom: var(--spacing-md); }
.form-group label { display: block; margin-bottom: var(--spacing-xs); font-weight: 600; font-size: var(--font-size-sm); }
.form-error { color: var(--danger); font-size: var(--font-size-sm); }
.mt-md { margin-top: var(--spacing-md); }
</style>
