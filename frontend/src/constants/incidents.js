export const ALLOWED_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
export const ALLOWED_INCIDENT_STATUSES = ['ACTIVE', 'RESOLVING', 'RESOLVED']

export const SEVERITY_LABELS = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

export const INCIDENT_STATUS_LABELS = {
  ACTIVE: 'Активный',
  RESOLVING: 'Решается',
  RESOLVED: 'Решён',
}

/** Допустимые переходы статусов инцидента */
export const incidentStatusTransitions = {
  ACTIVE: ['RESOLVING', 'RESOLVED'],
  RESOLVING: ['RESOLVED', 'ACTIVE'],
  RESOLVED: [],
}
