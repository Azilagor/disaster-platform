const prisma = require("../prismaClient");

const USER_PUBLIC_SELECT = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, role: true, isEmailVerified: true,
  telegramUsername: true, district: true, avatarUrl: true,
  createdAt: true, updatedAt: true,
};

const USER_DETAIL_SELECT = {
  ...USER_PUBLIC_SELECT,
  _count: { select: { createdRequests: true, volunteerRequests: true } },
};

async function findMany({ where, orderBy, take, skip }) {
  return prisma.$transaction([
    prisma.user.findMany({ where, orderBy, take, skip, select: USER_PUBLIC_SELECT }),
    prisma.user.count({ where }),
  ]);
}

async function findVolunteers({ where, take, skip }) {
  return prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, telegramUsername: true, district: true, avatarUrl: true,
        _count: { select: { volunteerRequests: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_DETAIL_SELECT,
      createdRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, problemType: true, district: true, createdAt: true },
      },
      volunteerRequests: {
        orderBy: { assignedAt: "desc" },
        take: 5,
        select: {
          assignedAt: true,
          request: {
            select: { id: true, title: true, status: true, priority: true, problemType: true, district: true, createdAt: true },
          },
        },
      },
    },
  });
}

async function update(id, data) {
  return prisma.user.update({ where: { id }, data, select: USER_PUBLIC_SELECT });
}

async function remove(userId) {
  return prisma.$transaction([
    prisma.requestVolunteer.deleteMany({ where: { volunteerId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

async function getStats() {
  return prisma.$transaction([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.user.count({ where: { isEmailVerified: false } }),
  ]);
}

async function getAdminOverview() {
  return prisma.$transaction([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.user.count({ where: { isEmailVerified: false } }),
    prisma.request.count(),
    prisma.request.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.request.groupBy({ by: ["priority"], _count: { id: true } }),
    prisma.request.groupBy({ by: ["district"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.request.count({ where: { isPublished: true } }),
    prisma.incident.count(),
    prisma.incident.count({ where: { status: { in: ["ACTIVE", "RESOLVING"] } } }),
  ]);
}

async function countActiveRequests(userId) {
  return prisma.request.count({
    where: { createdById: userId, status: { in: ["NEW", "IN_PROGRESS"] } },
  });
}

module.exports = {
  findMany, findVolunteers, findById,
  update, remove, getStats, getAdminOverview, countActiveRequests,
};