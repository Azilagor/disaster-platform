/**
 * Допустимые значения по API (platform.oyustudio.kz/api-docs/)
 */

export const ALLOWED_PROBLEM_TYPES = [
  'MEDICAL',
  'FOOD',
  'EVACUATION',
  'SHELTER',
  'REPAIR',
  'PSYCHOLOGICAL',
]

export const ALLOWED_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export const ALLOWED_DISTRICTS = [
  'ALMALYNSKIY',
  'AUEZOVSKIY',
  'BOSTANDYQ',
  'MEDEU',
  'NAURYZBAY',
  'TURKSIB',
  'ZHETYSU',
  'ALATAU',
]

/** Подписи типов проблем для UI */
export const PROBLEM_TYPE_LABELS = {
  MEDICAL: 'Медицинская помощь',
  FOOD: 'Питание',
  EVACUATION: 'Эвакуация',
  SHELTER: 'Жильё / приют',
  REPAIR: 'Ремонт',
  PSYCHOLOGICAL: 'Психологическая помощь',
}

/** Подписи приоритетов для UI */
export const PRIORITY_LABELS = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
}

/** Подписи статусов заявок */
export const REQUEST_STATUS_LABELS = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнена',
  CANCELLED: 'Отменена',
}

/** Допустимые переходы статусов заявок: текущий -> [следующие] */
export const STATUS_TRANSITIONS = {
  NEW: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED', 'NEW'],
  DONE: [],
  CANCELLED: [],
}

/**
 * Приблизительные центры районов Алматы (fallback для маркера, если заявка без latitude/longitude).
 */
export const DISTRICT_CENTROIDS = {
  ALMALYNSKIY: { lat: 43.256, lng: 76.928 },
  AUEZOVSKIY: { lat: 43.195, lng: 76.858 },
  BOSTANDYQ: { lat: 43.202, lng: 76.892 },
  MEDEU: { lat: 43.185, lng: 77.07 },
  NAURYZBAY: { lat: 43.285, lng: 76.82 },
  TURKSIB: { lat: 43.302, lng: 76.945 },
  ZHETYSU: { lat: 43.238, lng: 76.945 },
  ALATAU: { lat: 43.352, lng: 77.215 },
}

/** Подписи районов для UI */
export const DISTRICT_LABELS = {
  ALMALYNSKIY: 'Алмалинский',
  AUEZOVSKIY: 'Ауэзовский',
  BOSTANDYQ: 'Бостандыкский',
  MEDEU: 'Медеуский',
  NAURYZBAY: 'Наурызбайский',
  TURKSIB: 'Турксибский',
  ZHETYSU: 'Жетысуский',
  ALATAU: 'Алатауский',
}
