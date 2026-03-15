
// Общие утилиты валидации и пагинации
// Раньше дублировались в каждом файле маршрутов


const ALLOWED_DISTRICTS = [
  "ALMALYNSKIY",
  "AUEZOVSKIY",
  "BOSTANDYQ",
  "MEDEU",
  "NAURYZBAY",
  "TURKSIB",
  "ZHETYSU",
  "ALATAU",
];

const ALLOWED_ROLES = ["USER", "VOLUNTEER", "COORDINATOR", "ADMIN"];

const ALLOWED_PROBLEM_TYPES = [
  "MEDICAL",
  "FOOD",
  "EVACUATION",
  "SHELTER",
  "REPAIR",
  "PSYCHOLOGICAL",
];

const ALLOWED_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const ALLOWED_REQUEST_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "CANCELLED"];

const ALLOWED_INCIDENT_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const ALLOWED_INCIDENT_STATUSES = ["ACTIVE", "RESOLVING", "RESOLVED"];

/**
 * Валидирует обязательное enum-значение.
 * @returns {{ value: string } | { error: string }}
 */
function validateEnum(value, allowed, fieldName) {
  const upper = String(value || "").toUpperCase();
  if (!allowed.includes(upper)) {
    return {
      error: `Неверное значение для ${fieldName}: допустимы ${allowed.join(", ")}`,
    };
  }
  return { value: upper };
}

/**
 * Валидирует необязательное enum-значение.
 * Если значение пустое — возвращает { value: undefined }.
 * @returns {{ value: string | undefined } | { error: string }}
 */
function validateOptionalEnum(value, allowed, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { value: undefined };
  }
  return validateEnum(value, allowed, fieldName);
}

/**
 * Парсит параметры пагинации из query-строки.
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = {
  ALLOWED_DISTRICTS,
  ALLOWED_ROLES,
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_PRIORITIES,
  ALLOWED_REQUEST_STATUSES,
  ALLOWED_INCIDENT_SEVERITIES,
  ALLOWED_INCIDENT_STATUSES,
  validateEnum,
  validateOptionalEnum,
  parsePagination,
};