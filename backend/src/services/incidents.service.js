const repo = require("../repositories/incidents.repository");
const telegramService = require("./telegramService");
const logger = require("../utils/logger");
const {
  validateEnum, validateOptionalEnum, parsePagination,
  ALLOWED_INCIDENT_SEVERITIES, ALLOWED_INCIDENT_STATUSES, ALLOWED_DISTRICTS,
} = require("../utils/validation");

const STATUS_TRANSITIONS = {
  ACTIVE:    ["RESOLVING", "RESOLVED"],
  RESOLVING: ["RESOLVED", "ACTIVE"],
  RESOLVED:  [],
};

function _bad(msg)     { const e = new Error(msg); e.status = 400; return e; }
function _notFound(msg){ const e = new Error(msg); e.status = 404; return e; }

async function listIncidents(query) {
  const { severity, status, district } = query;
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  const sv   = validateOptionalEnum(severity, ALLOWED_INCIDENT_SEVERITIES, "severity");
  if (sv.error)   throw _bad(sv.error);
  const st   = validateOptionalEnum(status,   ALLOWED_INCIDENT_STATUSES,   "status");
  if (st.error)   throw _bad(st.error);
  const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS,           "district");
  if (dist.error) throw _bad(dist.error);

  if (sv.value)   where.severity = sv.value;
  if (st.value)   where.status   = st.value;
  if (dist.value) where.district = dist.value;

  const [items, total] = await repo.findMany({
    where, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: limit, skip,
  });
  return { items, total, page, limit };
}

async function listActiveIncidents(query) {
  const { district } = query;
  const where = {};
  const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
  if (dist.error) throw _bad(dist.error);
  if (dist.value) where.district = dist.value;
  return repo.findActive(where);
}

async function getIncident(id) {
  const incident = await repo.findById(id);
  if (!incident) throw _notFound("Инцидент не найден");
  return incident;
}

async function createIncident(userId, body) {
  const { title, description, severity, district } = body;
  if (!title || !description || !severity || !district)
    throw _bad("Обязательные поля: title, description, severity, district");

  const t = String(title).trim();
  const d = String(description).trim();
  if (t.length < 5 || t.length > 200) throw _bad("Заголовок: от 5 до 200 символов");
  if (d.length < 20)                  throw _bad("Описание: минимум 20 символов");

  const sv   = validateEnum(severity, ALLOWED_INCIDENT_SEVERITIES, "severity");
  if (sv.error)   throw _bad(sv.error);
  const dist = validateEnum(district, ALLOWED_DISTRICTS,           "district");
  if (dist.error) throw _bad(dist.error);

  const incident = await repo.create({
    title: t, description: d,
    severity: sv.value, district: dist.value,
    status: "ACTIVE", createdById: userId,
  });

  telegramService.notifyNewIncident(incident).catch((e) =>
    logger.error("Telegram notifyNewIncident error", { message: e.message })
  );

  logger.info("Incident created", { incidentId: incident.id, userId });
  return incident;
}

async function updateIncident(incidentId, body) {
  const existing = await repo.findByIdShort(incidentId);
  if (!existing)                throw _notFound("Инцидент не найден");
  if (existing.status === "RESOLVED") throw _bad("Нельзя редактировать завершённый инцидент");

  const { title, description, severity, district } = body;
  const data = {};

  if (title !== undefined) {
    const t = String(title).trim();
    if (t.length < 5 || t.length > 200) throw _bad("Заголовок: от 5 до 200 символов");
    data.title = t;
  }
  if (description !== undefined) {
    const d = String(description).trim();
    if (d.length < 20) throw _bad("Описание: минимум 20 символов");
    data.description = d;
  }
  if (severity !== undefined) {
    const sv = validateEnum(severity, ALLOWED_INCIDENT_SEVERITIES, "severity");
    if (sv.error) throw _bad(sv.error);
    data.severity = sv.value;
  }
  if (district !== undefined) {
    const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) throw _bad(dist.error);
    data.district = dist.value;
  }

  if (Object.keys(data).length === 0) throw _bad("Нет данных для обновления");
  return repo.update(incidentId, data);
}

async function changeStatus(incidentId, newStatus) {
  const sv = validateEnum(newStatus, ALLOWED_INCIDENT_STATUSES, "status");
  if (sv.error) throw _bad(sv.error);

  const incident = await repo.findByIdShort(incidentId);
  if (!incident) throw _notFound("Инцидент не найден");

  const allowed = STATUS_TRANSITIONS[incident.status] || [];
  if (!allowed.includes(sv.value))
    throw _bad(`Переход ${incident.status} → ${sv.value} недопустим`);

  const updated = await repo.update(incidentId, { status: sv.value });

  telegramService.notifyIncidentStatusChanged(updated, incident.status).catch((e) =>
    logger.error("Telegram notifyIncidentStatusChanged error", { message: e.message })
  );

  return updated;
}

async function deleteIncident(incidentId) {
  try {
    await repo.remove(incidentId);
  } catch (e) {
    if (e.code === "P2025") throw _notFound("Инцидент не найден");
    throw e;
  }
}

module.exports = {
  listIncidents, listActiveIncidents, getIncident,
  createIncident, updateIncident, changeStatus, deleteIncident,
};