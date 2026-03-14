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
