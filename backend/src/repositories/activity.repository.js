const prisma = require("../prismaClient");


// ActivityLog Repository


const LOG_SELECT = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  meta: true,
  createdAt: true,
  user: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
};

/**
 * Записать действие в лог.
 * Никогда не бросает исключение — ошибки логирования не должны
 * прерывать основной поток выполнения.
 */
async function log({ action, entityType, entityId = null, meta = null, userId = null }) {
  try {
    await prisma.activityLog.create({
      data: { action, entityType, entityId, meta, userId },
    });
  } catch (err) {
    // Намеренно только предупреждение — лог не критичен
    const logger = require("../utils/logger");
    logger.warn("ActivityLog write failed", { message: err.message, action });
  }
}

/**
 * Получить список логов с пагинацией и фильтрацией.
 */
async function findMany({ where = {}, skip = 0, take = 50 } = {}) {
  return prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: LOG_SELECT,
    }),
    prisma.activityLog.count({ where }),
  ]);
}

module.exports = { log, findMany };