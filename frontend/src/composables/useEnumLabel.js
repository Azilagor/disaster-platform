import { useI18n } from 'vue-i18n'

/** Локализованные подписи enum-полей заявок / инцидентов */
export function useEnumLabel() {
  const { t } = useI18n()
  return {
    priority: (code) => t(`labels.priority.${code}`),
    district: (code) => t(`labels.district.${code}`),
    problemType: (code) => t(`labels.problemType.${code}`),
    requestStatus: (code) => t(`labels.requestStatus.${code}`),
    severity: (code) => t(`labels.severity.${code}`),
    incidentStatus: (code) => t(`labels.incidentStatus.${code}`),
  }
}
