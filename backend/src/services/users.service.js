const repo = require("../repositories/users.repository");
const prisma = require("../prismaClient");
const logger = require("../utils/logger");
const normalizePhone = require("../utils/normalizePhone");
const {
  validateOptionalEnum, parsePagination,
  ALLOWED_ROLES, ALLOWED_DISTRICTS,
} = require("../utils/validation");

function _bad(msg)  { const e = new Error(msg); e.status = 400; return e; }
function _notFound(msg) { const e = new Error(msg); e.status = 404; return e; }

async function listUsers(query) {
  const { role, district, search, isEmailVerified } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  const rv = validateOptionalEnum(role,     ALLOWED_ROLES,     "role");
  if (rv.error)   throw _bad(rv.error);
  const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
  if (dv.error)   throw _bad(dv.error);

  if (rv.value) where.role     = rv.value;
  if (dv.value) where.district = dv.value;
  if (isEmailVerified !== undefined && isEmailVerified !== "")
    where.isEmailVerified = isEmailVerified === "true";

  if (search && String(search).trim().length >= 2) {
    const s = String(search).trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName:  { contains: s, mode: "insensitive" } },
      { email:     { contains: s, mode: "insensitive" } },
      { phone:     { contains: s } },
    ];
  }

  const [items, total] = await repo.findMany({
    where, orderBy: { createdAt: "desc" }, take: limit, skip,
  });
  return { items, total, page, limit };
}

async function listVolunteers(query) {
  const { district, search } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = { role: "VOLUNTEER" };

  const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
  if (dv.error) throw _bad(dv.error);
  if (dv.value) where.district = dv.value;

  if (search && String(search).trim().length >= 2) {
    const s = String(search).trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName:  { contains: s, mode: "insensitive" } },
      { email:     { contains: s, mode: "insensitive" } },
      { phone:     { contains: s } },
    ];
  }

  const [items, total] = await repo.findVolunteers({ where, take: limit, skip });
  return { items, total, page, limit };
}

async function getStats() {
  const [total, byRole, unverified] = await repo.getStats();
  const roleMap = {};
  for (const r of byRole) roleMap[r.role] = r._count.id;
  return {
    total, unverified,
    byRole: {
      USER: roleMap.USER || 0, VOLUNTEER: roleMap.VOLUNTEER || 0,
      COORDINATOR: roleMap.COORDINATOR || 0, ADMIN: roleMap.ADMIN || 0,
    },
  };
}

async function getAdminOverview() {
  const [
    totalUsers, usersByRole, unverifiedUsers,
    totalRequests, requestsByStatus, requestsByPriority,
    requestsByDistrict, publishedRequests,
    totalIncidents, activeIncidents,
  ] = await repo.getAdminOverview();

  const roleMap     = Object.fromEntries(usersByRole.map((r) => [r.role, r._count.id]));
  const statusMap   = Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count.id]));
  const priorityMap = Object.fromEntries(requestsByPriority.map((r) => [r.priority, r._count.id]));

  return {
    users: {
      total: totalUsers, unverified: unverifiedUsers,
      byRole: {
        USER: roleMap.USER || 0, VOLUNTEER: roleMap.VOLUNTEER || 0,
        COORDINATOR: roleMap.COORDINATOR || 0, ADMIN: roleMap.ADMIN || 0,
      },
    },
    requests: {
      total: totalRequests, published: publishedRequests,
      byStatus: {
        NEW: statusMap.NEW || 0, IN_PROGRESS: statusMap.IN_PROGRESS || 0,
        DONE: statusMap.DONE || 0, CANCELLED: statusMap.CANCELLED || 0,
      },
      byPriority: {
        CRITICAL: priorityMap.CRITICAL || 0, HIGH: priorityMap.HIGH || 0,
        MEDIUM: priorityMap.MEDIUM || 0,     LOW: priorityMap.LOW || 0,
      },
      byDistrict: requestsByDistrict.map((r) => ({ district: r.district, count: r._count.id })),
    },
    incidents: { total: totalIncidents, active: activeIncidents },
  };
}

async function getUser(id) {
  const user = await repo.findById(id);
  if (!user) throw _notFound("Пользователь не найден");
  return user;
}

async function changeRole(adminId, userId, role) {
  const rv = validateOptionalEnum(role, ALLOWED_ROLES, "role");
  if (rv.error) throw _bad(rv.error);

  if (userId === adminId) throw _bad("Нельзя менять роль самому себе");

  const user = await prisma.user.findUnique({
    where: { id: userId }, select: { id: true, role: true },
  });
  if (!user) throw _notFound("Пользователь не найден");
  if (user.role === "ADMIN" && rv.value !== "ADMIN")
    throw _bad("Нельзя изменить роль другого администратора");

  const updated = await repo.update(userId, { role: rv.value });
  logger.info("Role changed", { userId, newRole: rv.value, byAdmin: adminId });
  return updated;
}

async function updateUser(adminId, userId, body) {
  const existing = await prisma.user.findUnique({
    where: { id: userId }, select: { id: true, role: true },
  });
  if (!existing) throw _notFound("Пользователь не найден");
  if (existing.role === "ADMIN" && userId !== adminId)
    throw _bad("Нельзя редактировать другого администратора");

  const { firstName, lastName, email, phone, role, district, telegramUsername, isEmailVerified } = body;
  const data = {};

  if (firstName !== undefined) {
    const v = String(firstName).trim();
    if (v.length < 1 || v.length > 100) throw _bad("firstName: от 1 до 100 символов");
    data.firstName = v;
  }
  if (lastName !== undefined) {
    const v = String(lastName).trim();
    if (v.length < 1 || v.length > 100) throw _bad("lastName: от 1 до 100 символов");
    data.lastName = v;
  }
  if (email !== undefined) {
    const v = String(email).trim().toLowerCase();
    if (!v.includes("@")) throw _bad("Некорректный email");
    const taken = await prisma.user.findFirst({ where: { email: v, NOT: { id: userId } }, select: { id: true } });
    if (taken) throw _bad("Email уже используется");
    data.email = v;
  }
  if (phone !== undefined) {
    const v = normalizePhone(String(phone).trim());
    const taken = await prisma.user.findFirst({ where: { phone: v, NOT: { id: userId } }, select: { id: true } });
    if (taken) throw _bad("Телефон уже используется");
    data.phone = v;
  }
  if (role !== undefined) {
    const rv = validateOptionalEnum(role, ALLOWED_ROLES, "role");
    if (rv.error) throw _bad(rv.error);
    if (existing.role === "ADMIN" && rv.value !== "ADMIN") throw _bad("Нельзя изменить роль администратора");
    data.role = rv.value;
  }
  if (district !== undefined) {
    const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dv.error) throw _bad(dv.error);
    data.district = dv.value || null;
  }
  if (telegramUsername !== undefined)
    data.telegramUsername = telegramUsername ? String(telegramUsername).trim() : null;
  if (isEmailVerified !== undefined)
    data.isEmailVerified = Boolean(isEmailVerified);

  if (Object.keys(data).length === 0) throw _bad("Нет данных для обновления");
  return repo.update(userId, data);
}

async function deleteUser(adminId, userId) {
  if (userId === adminId) throw _bad("Нельзя удалить собственный аккаунт");

  const user = await prisma.user.findUnique({
    where: { id: userId }, select: { id: true, role: true },
  });
  if (!user) throw _notFound("Пользователь не найден");
  if (user.role === "ADMIN") throw _bad("Нельзя удалить администратора");

  const active = await repo.countActiveRequests(userId);
  if (active > 0)
    throw _bad(`Нельзя удалить пользователя с ${active} активными заявками. Сначала закройте или переназначьте их.`);

  await repo.remove(userId);
  logger.info("User deleted by admin", { userId, byAdmin: adminId });
}

module.exports = {
  listUsers, listVolunteers, getStats, getAdminOverview,
  getUser, changeRole, updateUser, deleteUser,
};