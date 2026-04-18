export const ALLOWED_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export const ALLOWED_INCIDENT_STATUSES = ['ACTIVE', 'RESOLVING', 'RESOLVED']

/** Подписи степени/статуса — см. vue-i18n `labels.severity` / `labels.incidentStatus` */

/** Допустимые переходы статусов инцидента */
export const incidentStatusTransitions = {
  ACTIVE: ['RESOLVING', 'RESOLVED'],
  RESOLVING: ['RESOLVED', 'ACTIVE'],
  RESOLVED: [],
}
