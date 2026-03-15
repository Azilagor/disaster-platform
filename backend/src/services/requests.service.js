    const repo = require("../repositories/requests.repository");
const prisma = require("../prismaClient");
const telegramService = require("./telegramService");
const logger = require("../utils/logger");
const {
  validateEnum,
  validateOptionalEnum,
  parsePagination,
  ALLOWED_PROBLEM_TYPES,
  ALLOWED_PRIORITIES,
  ALLOWED_DISTRICTS,
  ALLOWED_REQUEST_STATUSES,
} = require("../utils/validation");


// Requests Service — бизнес-логика


const STATUS_TRANSITIONS = {
  NEW:         ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED", "NEW"],
  DONE:        [],
  CANCELLED:   [],
};

function _badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function _forbidden(message) {
  const err = new Error(message);
  err.status = 403;
  return err;
}

function _notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function _canAccess(user, request) {
  if (user.role === "COORDINATOR" || user.role === "ADMIN") return true;
  if (request.createdById === user.id) return true;
  if (user.role === "VOLUNTEER" && request.isPublished) return true;
  if (
    user.role === "VOLUNTEER" &&
    request.volunteers?.some((v) => v.volunteer.id === user.id)
  )
    return true;
  return false;
}

async function createRequest(userId, body) {
  const {
    problemType, title, description, priority, peopleCount,
    address, district, landmark, additionalInfo,
    contactName, contactPhone, contactEmail, contactTelegram,
    latitude, longitude,
  } = body;

  if (!problemType || !title || !description || !priority || !address || !district) {
    throw _badRequest(
      "Обязательные поля: problemType, title, description, priority, address, district"
    );
  }

  const trimmedTitle = String(title).trim();
  const trimmedDesc  = String(description).trim();

  if (trimmedTitle.length < 5 || trimmedTitle.length > 200)
    throw _badRequest("Заголовок: от 5 до 200 символов");
  if (trimmedDesc.length < 50)
    throw _badRequest("Описание должно быть минимум 50 символов");

  const pt   = validateEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
  if (pt.error)   throw _badRequest(pt.error);
  const pr   = validateEnum(priority, ALLOWED_PRIORITIES, "priority");
  if (pr.error)   throw _badRequest(pr.error);
  const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
  if (dist.error) throw _badRequest(dist.error);

  const count = Number(peopleCount);
  if (peopleCount !== undefined && (isNaN(count) || count < 1 || count > 1000))
    throw _badRequest("peopleCount: от 1 до 1000");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  });
  if (!user) throw _notFound("Пользователь не найден");

  const created = await repo.create({
    problemType: pt.value,
    title: trimmedTitle,
    description: trimmedDesc,
    priority: pr.value,
    status: "NEW",
    peopleCount: count > 0 ? count : 1,
    address: String(address).trim(),
    district: dist.value,
    landmark:       landmark       ? String(landmark).trim()       : null,
    contactName:    contactName    ? String(contactName).trim()    : `${user.firstName} ${user.lastName}`,
    contactPhone:   contactPhone   ? String(contactPhone).trim()   : user.phone,
    contactEmail:   contactEmail   ? String(contactEmail).trim()   : user.email,
    contactTelegram: contactTelegram ? String(contactTelegram).trim() : null,
    additionalInfo: additionalInfo ? String(additionalInfo).trim() : null,
    latitude:  latitude  !== undefined ? Number(latitude)  || null : null,
    longitude: longitude !== undefined ? Number(longitude) || null : null,
    consentAt: new Date(),
    createdById: user.id,
  });

  logger.info("Request created", { requestId: created.id, userId });
  return created;
}

async function listRequests(query) {
  const { status, priority, problemType, district, search } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  const st   = validateOptionalEnum(status,      ALLOWED_REQUEST_STATUSES, "status");
  if (st.error)   throw _badRequest(st.error);
  const pr   = validateOptionalEnum(priority,    ALLOWED_PRIORITIES,       "priority");
  if (pr.error)   throw _badRequest(pr.error);
  const pt   = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES,    "problemType");
  if (pt.error)   throw _badRequest(pt.error);
  const dist = validateOptionalEnum(district,    ALLOWED_DISTRICTS,        "district");
  if (dist.error) throw _badRequest(dist.error);

  if (st.value)   where.status      = st.value;
  if (pr.value)   where.priority    = pr.value;
  if (pt.value)   where.problemType = pt.value;
  if (dist.value) where.district    = dist.value;

  if (search && String(search).trim().length >= 2) {
    const s = String(search).trim();
    where.OR = [
      { title:   { contains: s, mode: "insensitive" } },
      { address: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await repo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });

  return { items, total, page, limit };
}

async function listMyRequests(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await repo.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });
  return { items, total, page, limit };
}

async function listAssignedRequests(userId, query) {
  const { status, priority, problemType, district } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = { volunteers: { some: { volunteerId: userId } } };

  const st   = validateOptionalEnum(status,      ALLOWED_REQUEST_STATUSES, "status");
  if (st.error)   throw _badRequest(st.error);
  const pr   = validateOptionalEnum(priority,    ALLOWED_PRIORITIES,       "priority");
  if (pr.error)   throw _badRequest(pr.error);
  const pt   = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES,    "problemType");
  if (pt.error)   throw _badRequest(pt.error);
  const dist = validateOptionalEnum(district,    ALLOWED_DISTRICTS,        "district");
  if (dist.error) throw _badRequest(dist.error);

  if (st.value)   where.status      = st.value;
  if (pr.value)   where.priority    = pr.value;
  if (pt.value)   where.problemType = pt.value;
  if (dist.value) where.district    = dist.value;

  const [items, total] = await repo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });
  return { items, total, page, limit };
}

async function getMapRequests(query) {
  const { priority, problemType, district } = query;
  const where = { status: { in: ["NEW", "IN_PROGRESS"] }, isPublished: true };

  const pr   = validateOptionalEnum(priority,    ALLOWED_PRIORITIES,    "priority");
  if (pr.error)   throw _badRequest(pr.error);
  const pt   = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
  if (pt.error)   throw _badRequest(pt.error);
  const dist = validateOptionalEnum(district,    ALLOWED_DISTRICTS,     "district");
  if (dist.error) throw _badRequest(dist.error);

  if (pr.value)   where.priority    = pr.value;
  if (pt.value)   where.problemType = pt.value;
  if (dist.value) where.district    = dist.value;

  const items = await repo.findForMap(where);

  const byDistrict = {};
  for (const item of items) {
    if (!byDistrict[item.district]) byDistrict[item.district] = [];
    byDistrict[item.district].push(item);
  }
  return { total: items.length, items, byDistrict };
}

async function getRequest(user, requestId) {
  const request = await repo.findById(requestId);
  if (!request) throw _notFound("Заявка не найдена");
  if (!_canAccess(user, request)) throw _forbidden("Недостаточно прав");
  return request;
}

async function updateRequest(user, requestId, body) {
  const request = await repo.findByIdShort(requestId);
  if (!request) throw _notFound("Заявка не найдена");

  const isCoordinator = user.role === "COORDINATOR" || user.role === "ADMIN";
  const isOwner       = request.createdById === user.id;
  if (!isCoordinator && !isOwner) throw _forbidden("Недостаточно прав");

  if (request.status === "DONE" || request.status === "CANCELLED")
    throw _badRequest("Нельзя редактировать закрытую заявку");

  const {
    title, description, priority, problemType, peopleCount,
    address, district, landmark, additionalInfo,
    contactName, contactPhone, contactEmail, contactTelegram,
    latitude, longitude,
  } = body;
  const data = {};

  if (title !== undefined) {
    const t = String(title).trim();
    if (t.length < 5 || t.length > 200) throw _badRequest("Заголовок: от 5 до 200 символов");
    data.title = t;
  }
  if (description !== undefined) {
    const d = String(description).trim();
    if (d.length < 50) throw _badRequest("Описание: минимум 50 символов");
    data.description = d;
  }
  if (priority !== undefined) {
    const pr = validateEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) throw _badRequest(pr.error);
    data.priority = pr.value;
  }
  if (problemType !== undefined) {
    const pt = validateEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) throw _badRequest(pt.error);
    data.problemType = pt.value;
  }
  if (district !== undefined) {
    const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) throw _badRequest(dist.error);
    data.district = dist.value;
  }
  if (peopleCount !== undefined) {
    const c = Number(peopleCount);
    if (isNaN(c) || c < 1 || c > 1000) throw _badRequest("peopleCount: от 1 до 1000");
    data.peopleCount = c;
  }

  if (address        !== undefined) data.address        = String(address).trim();
  if (landmark       !== undefined) data.landmark       = landmark ? String(landmark).trim() : null;
  if (additionalInfo !== undefined) data.additionalInfo = additionalInfo ? String(additionalInfo).trim() : null;
  if (contactName    !== undefined) data.contactName    = String(contactName).trim();
  if (contactPhone   !== undefined) data.contactPhone   = String(contactPhone).trim();
  if (contactEmail   !== undefined) data.contactEmail   = contactEmail || null;
  if (contactTelegram !== undefined) data.contactTelegram = contactTelegram || null;
  if (latitude       !== undefined) data.latitude       = latitude  ? Number(latitude)  : null;
  if (longitude      !== undefined) data.longitude      = longitude ? Number(longitude) : null;

  if (Object.keys(data).length === 0) throw _badRequest("Нет данных для обновления");

  return repo.update(requestId, data);
}

async function changeStatus(user, requestId, newStatus) {
  const sv = validateEnum(newStatus, ALLOWED_REQUEST_STATUSES, "status");
  if (sv.error) throw _badRequest(sv.error);

  const request = await repo.findForStatusChange(requestId);
  if (!request) throw _notFound("Заявка не найдена");

  const allowed = STATUS_TRANSITIONS[request.status] || [];
  if (!allowed.includes(sv.value))
    throw _badRequest(`Переход ${request.status} → ${sv.value} недопустим`);

  const isCoordinator      = user.role === "COORDINATOR" || user.role === "ADMIN";
  const isOwner            = request.createdById === user.id;
  const isAssignedVolunteer =
    user.role === "VOLUNTEER" &&
    request.volunteers.some((v) => v.volunteer.id === user.id);

  if (sv.value === "DONE") {
    if (!isCoordinator && !isAssignedVolunteer) throw _forbidden("Недостаточно прав для завершения");
  } else if (sv.value === "CANCELLED") {
    if (!isCoordinator && !isOwner) throw _forbidden("Недостаточно прав для отмены");
  } else {
    if (!isCoordinator) throw _forbidden("Недостаточно прав");
  }

  const updated = await repo.update(requestId, { status: sv.value });

  if (sv.value === "DONE") {
    telegramService.notifyRequestDone(updated).catch((e) =>
      logger.error("Telegram notifyRequestDone error", { message: e.message })
    );
  }

  return updated;
}

async function publishRequest(user, requestId) {
  const request = await repo.findByIdShort(requestId);
  if (!request) throw _notFound("Заявка не найдена");
  if (request.isPublished) throw _badRequest("Заявка уже опубликована");
  if (request.status === "CANCELLED") throw _badRequest("Нельзя опубликовать отменённую заявку");

  const updated = await repo.update(requestId, {
    isPublished:  true,
    publishedAt:  new Date(),
    publishedById: user.id,
  });

  telegramService.notifyNewRequest(updated).catch((e) =>
    logger.error("Telegram notifyNewRequest error", { message: e.message })
  );

  logger.info("Request published", { requestId, userId: user.id });
  return updated;
}

async function unpublishRequest(user, requestId) {
  const request = await repo.findByIdShort(requestId);
  if (!request) throw _notFound("Заявка не найдена");
  if (!request.isPublished) throw _badRequest("Заявка и так не опубликована");

  const updated = await repo.update(requestId, {
    isPublished:  false,
    publishedAt:  null,
    publishedById: null,
  });

  telegramService.notifyRequestUnpublished(updated).catch((e) =>
    logger.error("Telegram notifyRequestUnpublished error", { message: e.message })
  );

  return updated;
}

async function assignVolunteer(requestId, volunteerId) {
  const [request, volunteer] = await Promise.all([
    repo.findByIdShort(requestId),
    prisma.user.findUnique({
      where: { id: volunteerId },
      select: { id: true, role: true, firstName: true, lastName: true, telegramChatId: true },
    }),
  ]);

  if (!request) throw _notFound("Заявка не найдена");
  if (!volunteer || volunteer.role !== "VOLUNTEER")
    throw _badRequest("Пользователь не является волонтёром");
  if (request.status === "DONE" || request.status === "CANCELLED")
    throw _badRequest("Нельзя назначать волонтёров на закрытую заявку");

  try {
    await repo.addVolunteer(requestId, volunteerId);
  } catch (e) {
    if (e.code === "P2002") throw _badRequest("Волонтёр уже назначен на эту заявку");
    throw e;
  }

  const updated = await repo.update(
    requestId,
    request.status === "NEW" ? { status: "IN_PROGRESS" } : {}
  );

  telegramService.notifyVolunteerAssigned(updated, volunteer).catch((e) =>
    logger.error("Telegram notifyVolunteerAssigned error", { message: e.message })
  );

  return updated;
}

async function unassignVolunteer(requestId, volunteerId) {
  try {
    await repo.removeVolunteer(requestId, volunteerId);
  } catch (e) {
    if (e.code === "P2025") throw _notFound("Назначение не найдено");
    throw e;
  }

  const [left, reqNow] = await Promise.all([
    repo.countVolunteers(requestId),
    repo.findByIdShort(requestId),
  ]);

  const shouldRevert = reqNow?.status === "IN_PROGRESS" && left === 0;
  return repo.update(requestId, shouldRevert ? { status: "NEW" } : {});
}

async function volunteerJoin(user, requestId) {
  const request = await repo.findByIdShort(requestId);
  if (!request) throw _notFound("Заявка не найдена");
  if (!request.isPublished) throw _forbidden("Заявка ещё не опубликована");
  if (request.status === "DONE" || request.status === "CANCELLED")
    throw _badRequest("Заявка уже закрыта");

  try {
    await repo.addVolunteer(requestId, user.id);
  } catch (e) {
    if (e.code === "P2002") throw _badRequest("Вы уже записаны на эту заявку");
    throw e;
  }

  const updated = await repo.update(
    requestId,
    request.status === "NEW" ? { status: "IN_PROGRESS" } : {}
  );

  telegramService.notifyVolunteerAlreadyJoined(requestId, user.id).catch(() => {});
  return updated;
}

async function volunteerLeave(user, requestId) {
  try {
    await repo.removeVolunteer(requestId, user.id);
  } catch (e) {
    if (e.code === "P2025") throw _notFound("Вы не записаны на эту заявку");
    throw e;
  }

  const [left, reqNow] = await Promise.all([
    repo.countVolunteers(requestId),
    repo.findByIdShort(requestId),
  ]);

  const shouldRevert = reqNow?.status === "IN_PROGRESS" && left === 0;
  return repo.update(requestId, shouldRevert ? { status: "NEW" } : {});
}

async function deleteRequest(requestId) {
  try {
    await repo.remove(requestId);
  } catch (e) {
    if (e.code === "P2025") throw _notFound("Заявка не найдена");
    throw e;
  }
}

async function linkToIncident(user, requestId, incidentId) {
  const request = await repo.findByIdShort(requestId);
  if (!request) throw _notFound("Заявка не найдена");

  if (incidentId !== null) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { id: true, status: true },
    });
    if (!incident) throw _notFound("Инцидент не найден");
    if (incident.status === "RESOLVED")
      throw _badRequest("Нельзя привязать заявку к завершённому инциденту");
  }

  const updated = await repo.update(requestId, { incidentId });
  logger.info("Request linked to incident", { requestId, incidentId, userId: user.id });
  return updated;
}

module.exports = {
  createRequest,
  listRequests,
  linkToIncident,
  listMyRequests,
  listAssignedRequests,
  getMapRequests,
  getRequest,
  updateRequest,
  changeStatus,
  publishRequest,
  unpublishRequest,
  assignVolunteer,
  unassignVolunteer,
  volunteerJoin,
  volunteerLeave,
  deleteRequest,
};