const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const { auth, allowRoles } = require("../middleware/auth");

const ALLOWED_ROLES = ["USER", "VOLUNTEER", "COORDINATOR", "ADMIN"];

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

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function validateOptionalEnum(value, allowed, fieldName) {
  if (value === undefined || value === null || value === "") return { value: undefined };
  const upper = String(value).toUpperCase();
  if (!allowed.includes(upper)) {
    return { error: `Неверное значение для ${fieldName}: допустимы ${allowed.join(", ")}` };
  }
  return { value: upper };
}

const USER_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isEmailVerified: true,
  telegramUsername: true,
  district: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

const USER_DETAIL_SELECT = {
  ...USER_PUBLIC_SELECT,
  _count: {
    select: {
      createdRequests: true,
      volunteerRequests: true,
    },
  },
};

// GET /users
router.get("/", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const { role, district, search, isEmailVerified } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};

    const rv = validateOptionalEnum(role, ALLOWED_ROLES, "role");
    if (rv.error) return res.status(400).json({ message: rv.error });
    if (rv.value) where.role = rv.value;

    const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dv.error) return res.status(400).json({ message: dv.error });
    if (dv.value) where.district = dv.value;

    if (isEmailVerified !== undefined && isEmailVerified !== "") {
      where.isEmailVerified = isEmailVerified === "true";
    }

    if (search && String(search).trim().length >= 2) {
      const s = String(search).trim();
      where.OR = [
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: USER_PUBLIC_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /users/volunteers
router.get("/volunteers", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const { district, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = { role: "VOLUNTEER" };

    const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dv.error) return res.status(400).json({ message: dv.error });
    if (dv.value) where.district = dv.value;

    if (search && String(search).trim().length >= 2) {
      const s = String(search).trim();
      where.OR = [
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { phone: { contains: s } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          telegramUsername: true,
          district: true,
          avatarUrl: true,
          _count: {
            select: {
              volunteerRequests: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /users/volunteers error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /users/stats
router.get("/stats", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const [total, byRole, unverified] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.user.count({ where: { isEmailVerified: false } }),
    ]);

    const roleMap = {};
    for (const item of byRole) {
      roleMap[item.role] = item._count.id;
    }

    return res.json({
      total,
      unverified,
      byRole: {
        USER: roleMap.USER || 0,
        VOLUNTEER: roleMap.VOLUNTEER || 0,
        COORDINATOR: roleMap.COORDINATOR || 0,
        ADMIN: roleMap.ADMIN || 0,
      },
    });
  } catch (err) {
    console.error("GET /users/stats error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /users/admin/overview
router.get("/admin/overview", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      unverifiedUsers,
      totalRequests,
      requestsByStatus,
      requestsByPriority,
      requestsByDistrict,
      publishedRequests,
      totalIncidents,
      activeIncidents,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.user.count({ where: { isEmailVerified: false } }),
      prisma.request.count(),
      prisma.request.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.request.groupBy({
        by: ["priority"],
        _count: { id: true },
      }),
      prisma.request.groupBy({
        by: ["district"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.request.count({ where: { isPublished: true } }),
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ["ACTIVE", "RESOLVING"] } } }),
    ]);

    const roleMap = {};
    for (const r of usersByRole) roleMap[r.role] = r._count.id;

    const statusMap = {};
    for (const r of requestsByStatus) statusMap[r.status] = r._count.id;

    const priorityMap = {};
    for (const r of requestsByPriority) priorityMap[r.priority] = r._count.id;

    const districtMap = requestsByDistrict.map((r) => ({
      district: r.district,
      count: r._count.id,
    }));

    return res.json({
      users: {
        total: totalUsers,
        unverified: unverifiedUsers,
        byRole: {
          USER: roleMap.USER || 0,
          VOLUNTEER: roleMap.VOLUNTEER || 0,
          COORDINATOR: roleMap.COORDINATOR || 0,
          ADMIN: roleMap.ADMIN || 0,
        },
      },
      requests: {
        total: totalRequests,
        published: publishedRequests,
        byStatus: {
          NEW: statusMap.NEW || 0,
          IN_PROGRESS: statusMap.IN_PROGRESS || 0,
          DONE: statusMap.DONE || 0,
          CANCELLED: statusMap.CANCELLED || 0,
        },
        byPriority: {
          CRITICAL: priorityMap.CRITICAL || 0,
          HIGH: priorityMap.HIGH || 0,
          MEDIUM: priorityMap.MEDIUM || 0,
          LOW: priorityMap.LOW || 0,
        },
        byDistrict: districtMap,
      },
      incidents: {
        total: totalIncidents,
        active: activeIncidents,
      },
    });
  } catch (err) {
    console.error("GET /users/admin/overview error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /users/:id
router.get("/:id", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || userId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_DETAIL_SELECT,
        createdRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            problemType: true,
            district: true,
            createdAt: true,
          },
        },
        volunteerRequests: {
          orderBy: { assignedAt: "desc" },
          take: 5,
          select: {
            assignedAt: true,
            request: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                problemType: true,
                district: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    return res.json(user);
  } catch (err) {
    console.error("GET /users/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PATCH /users/:id/role
router.patch("/:id/role", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || userId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const { role } = req.body || {};
    if (!role) return res.status(400).json({ message: "role обязателен" });

    const rv = validateOptionalEnum(role, ALLOWED_ROLES, "role");
    if (rv.error) return res.status(400).json({ message: rv.error });

    if (userId === req.user.id) {
      return res.status(400).json({ message: "Нельзя менять роль самому себе" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    if (user.role === "ADMIN" && rv.value !== "ADMIN") {
      return res.status(400).json({
        message: "Нельзя изменить роль другого администратора",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: rv.value },
      select: USER_PUBLIC_SELECT,
    });

    return res.json({ message: `Роль изменена на ${rv.value}`, user: updated });
  } catch (err) {
    console.error("PATCH /users/:id/role error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /users/:id
router.delete("/:id", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || userId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    if (userId === req.user.id) {
      return res.status(400).json({ message: "Нельзя удалить собственный аккаунт" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        _count: { select: { createdRequests: true } },
      },
    });

    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Нельзя удалить администратора" });
    }

    const activeRequests = await prisma.request.count({
      where: {
        createdById: userId,
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    });

    if (activeRequests > 0) {
      return res.status(400).json({
        message: `Нельзя удалить пользователя с ${activeRequests} активными заявками. Сначала закройте или переназначьте их.`,
      });
    }

    await prisma.$transaction([
      prisma.requestVolunteer.deleteMany({ where: { volunteerId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return res.json({ message: "Пользователь удалён" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    console.error("DELETE /users/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PUT /users/:id
router.put("/:id", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || userId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, phone: true },
    });

    if (!existing) return res.status(404).json({ message: "Пользователь не найден" });

    if (existing.role === "ADMIN" && userId !== req.user.id) {
      return res.status(400).json({ message: "Нельзя редактировать другого администратора" });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      district,
      telegramUsername,
      isEmailVerified,
    } = req.body || {};

    const data = {};

    if (firstName !== undefined) {
      const v = String(firstName).trim();
      if (v.length < 1 || v.length > 100)
        return res.status(400).json({ message: "firstName: от 1 до 100 символов" });
      data.firstName = v;
    }

    if (lastName !== undefined) {
      const v = String(lastName).trim();
      if (v.length < 1 || v.length > 100)
        return res.status(400).json({ message: "lastName: от 1 до 100 символов" });
      data.lastName = v;
    }

    if (email !== undefined) {
      const v = String(email).trim().toLowerCase();
      if (!v.includes("@"))
        return res.status(400).json({ message: "Некорректный email" });
      const taken = await prisma.user.findFirst({
        where: { email: v, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) return res.status(400).json({ message: "Email уже используется" });
      data.email = v;
    }

    if (phone !== undefined) {
      const v = String(phone).trim();
      const taken = await prisma.user.findFirst({
        where: { phone: v, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) return res.status(400).json({ message: "Телефон уже используется" });
      data.phone = v;
    }

    if (role !== undefined) {
      const rv = validateOptionalEnum(role, ALLOWED_ROLES, "role");
      if (rv.error) return res.status(400).json({ message: rv.error });
      if (existing.role === "ADMIN" && rv.value !== "ADMIN") {
        return res.status(400).json({ message: "Нельзя изменить роль администратора" });
      }
      data.role = rv.value;
    }

    if (district !== undefined) {
      const dv = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
      if (dv.error) return res.status(400).json({ message: dv.error });
      data.district = dv.value || null;
    }

    if (telegramUsername !== undefined) {
      data.telegramUsername = telegramUsername ? String(telegramUsername).trim() : null;
    }

    if (isEmailVerified !== undefined) {
      data.isEmailVerified = Boolean(isEmailVerified);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_SELECT,
    });

    return res.json({ message: "Пользователь обновлён", user: updated });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email или телефон уже используется" });
    }
    console.error("PUT /users/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;