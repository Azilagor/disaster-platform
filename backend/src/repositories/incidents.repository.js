const prisma = require("../prismaClient");

const INCIDENT_LIST_SELECT = {
  id: true, title: true, severity: true, status: true,
  district: true, createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

const INCIDENT_DETAIL_SELECT = {
  id: true, title: true, description: true,
  severity: true, status: true, district: true,
  createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true, phone: true } },
};

async function findMany({ where, orderBy, take, skip }) {
  return prisma.$transaction([
    prisma.incident.findMany({ where, orderBy, take, skip, select: INCIDENT_LIST_SELECT }),
    prisma.incident.count({ where }),
  ]);
}

async function findActive(where) {
  return prisma.incident.findMany({
    where: { ...where, status: { in: ["ACTIVE", "RESOLVING"] } },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    select: INCIDENT_LIST_SELECT,
  });
}

async function findById(id) {
  return prisma.incident.findUnique({ where: { id }, select: INCIDENT_DETAIL_SELECT });
}

async function findByIdShort(id) {
  return prisma.incident.findUnique({
    where: { id }, select: { id: true, status: true, title: true, district: true },
  });
}

async function create(data) {
  return prisma.incident.create({ data, select: INCIDENT_DETAIL_SELECT });
}

async function update(id, data) {
  return prisma.incident.update({ where: { id }, data, select: INCIDENT_DETAIL_SELECT });
}

async function remove(id) {
  return prisma.incident.delete({ where: { id } });
}

module.exports = {
  findMany, findActive, findById, findByIdShort, create, update, remove,
  INCIDENT_DETAIL_SELECT,
};