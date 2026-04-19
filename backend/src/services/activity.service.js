const repo = require("../repositories/activity.repository");
const { parsePagination } = require("../utils/validation");


// Activity Service


/**
 * Центральная функция записи лога.
 * Импортируй её в любой service и вызывай после успешного действия.
 *
 * Пример:
 *   await activity.log({ action: 'REQUEST_CREATED', entityType: 'request', entityId: req.id, userId: user.id })
 */
async function log(params) {
  return repo.log(params);
}

/**
 * Получить список логов для /admin/logs
 */
async function getLogs(query) {
  const { action, entityType, userId } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (action)     where.action     = String(action).toUpperCase();
  if (entityType) where.entityType = String(entityType).toLowerCase();
  if (userId)     where.userId     = Number(userId) || undefined;

  const [items, total] = await repo.findMany({ where, skip, take: limit });
  return { items, total, page, limit };
}

module.exports = { log, getLogs };