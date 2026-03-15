const prisma = require("../prismaClient");


// Requests Repository — только Prisma-запросы


const REQUEST_LIST_SELECT = {
  id: true,
  problemType: true,
  title: true,
  priority: true,
  status: true,
  peopleCount: true,
  address: true,
  district: true,
  isPublished: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  volunteers: {
    select: {
      volunteer: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      assignedAt: true,
    },
  },
};

const REQUEST_DETAIL_INCLUDE = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  },
  volunteers: {
    select: {
      volunteer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          district: true,
          telegramUsername: true,
          avatarUrl: true,
        },
      },
      assignedAt: true,
    },
  },
};

const REQUEST_MAP_SELECT = {
  id: true,
  title: true,
  problemType: true,
  priority: true,
  status: true,
  address: true,
  district: true,
  landmark: true,
  peopleCount: true,
  contactPhone: true,
  latitude: true,
  longitude: true,
  isPublished: true,
  createdAt: true,
  _count: { select: { volunteers: true } },
};

async function create(data) {
  return prisma.request.create({ data, include: REQUEST_DETAIL_INCLUDE });
}

async function findMany({ where, orderBy, take, skip }) {
  return prisma.$transaction([
    prisma.request.findMany({ where, orderBy, take, skip, select: REQUEST_LIST_SELECT }),
    prisma.request.count({ where }),
  ]);
}

async function findById(id) {
  return prisma.request.findUnique({
    where: { id },
    include: REQUEST_DETAIL_INCLUDE,
  });
}

async function findByIdShort(id) {
  return prisma.request.findUnique({
    where: { id },
    select: { id: true, status: true, createdById: true, isPublished: true },
  });
}

async function findForStatusChange(id) {
  return prisma.request.findUnique({
    where: { id },
    include: { volunteers: { select: { volunteer: { select: { id: true } } } } },
  });
}

async function findForMap(where) {
  return prisma.request.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    select: REQUEST_MAP_SELECT,
  });
}

async function update(id, data) {
  return prisma.request.update({ where: { id }, data, include: REQUEST_DETAIL_INCLUDE });
}

async function remove(id) {
  return prisma.request.delete({ where: { id } });
}

// ── Volunteers ────────────────────────────────────────────────

async function addVolunteer(requestId, volunteerId) {
  return prisma.requestVolunteer.create({ data: { requestId, volunteerId } });
}

async function removeVolunteer(requestId, volunteerId) {
  return prisma.requestVolunteer.delete({
    where: { requestId_volunteerId: { requestId, volunteerId } },
  });
}

async function countVolunteers(requestId) {
  return prisma.requestVolunteer.count({ where: { requestId } });
}

module.exports = {
  create,
  findMany,
  findById,
  findByIdShort,
  findForStatusChange,
  findForMap,
  update,
  remove,
  addVolunteer,
  removeVolunteer,
  countVolunteers,
};