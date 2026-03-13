const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const { auth, allowRoles } = require("../middleware/auth");

const ALLOWED_PROBLEM_TYPES = [
  "MEDICAL",
  "FOOD",
  "EVACUATION",
  "SHELTER",
  "REPAIR",
  "PSYCHOLOGICAL",
];

const ALLOWED_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

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

const ALLOWED_STATUSES = ["NEW", "IN_PROGRESS", "DONE", "CANCELLED"];

const STATUS_TRANSITIONS = {
  NEW: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED", "NEW"],
  DONE: [],
  CANCELLED: [],
};

function validateEnum(value, allowed, fieldName) {
  const upper = String(value || "").toUpperCase();
  if (!allowed.includes(upper)) {
    return { error: `Неверное значение для ${fieldName}: допустимы ${allowed.join(", ")}` };
  }
  return { value: upper };
}

function validateOptionalEnum(value, allowed, fieldName) {
  if (value === undefined || value === null || value === "") return { value: undefined };
  return validateEnum(value, allowed, fieldName);
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

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
      volunteer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
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

function canAccessRequest(user, request) {
  if (user.role === "COORDINATOR" || user.role === "ADMIN") return true;
  if (request.createdById === user.id) return true;
  if (user.role === "VOLUNTEER" && request.isPublished) return true;
  if (
    user.role === "VOLUNTEER" &&
    request.volunteers.some((v) => v.volunteer.id === user.id)
  )
    return true;
  return false;
}

// POST /requests
router.post("/", auth, async (req, res) => {
  try {
    const {
      problemType,
      title,
      description,
      priority,
      peopleCount,
      address,
      district,
      landmark,
      additionalInfo,
      contactName,
      contactPhone,
      contactEmail,
      contactTelegram,
      latitude,
      longitude,
    } = req.body || {};

    if (!problemType || !title || !description || !priority || !address || !district) {
      return res.status(400).json({
        message: "Обязательные поля: problemType, title, description, priority, address, district",
      });
    }

    const trimmedTitle = String(title).trim();
    const trimmedDesc = String(description).trim();

    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      return res.status(400).json({ message: "Заголовок: от 5 до 200 символов" });
    }

    if (trimmedDesc.length < 50) {
      return res.status(400).json({ message: "Описание должно быть минимум 50 символов" });
    }

    const pt = validateEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) return res.status(400).json({ message: pt.error });

    const pr = validateEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) return res.status(400).json({ message: pr.error });

    const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });

    const count = Number(peopleCount);
    if (peopleCount !== undefined && (isNaN(count) || count < 1 || count > 1000)) {
      return res.status(400).json({ message: "peopleCount: от 1 до 1000" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });

    if (!user) return res.status(404).json({ message: "Пользователь не найден" });

    const created = await prisma.request.create({
      data: {
        problemType: pt.value,
        title: trimmedTitle,
        description: trimmedDesc,
        priority: pr.value,
        status: "NEW",
        peopleCount: count > 0 ? count : 1,
        address: String(address).trim(),
        district: dist.value,
        landmark: landmark ? String(landmark).trim() : null,
        contactName: contactName
          ? String(contactName).trim()
          : `${user.firstName} ${user.lastName}`,
        contactPhone: contactPhone ? String(contactPhone).trim() : user.phone,
        contactEmail: contactEmail ? String(contactEmail).trim() : user.email,
        contactTelegram: contactTelegram ? String(contactTelegram).trim() : null,
        additionalInfo: additionalInfo ? String(additionalInfo).trim() : null,
        latitude: latitude !== undefined ? Number(latitude) || null : null,
        longitude: longitude !== undefined ? Number(longitude) || null : null,
        consentAt: new Date(),
        createdById: user.id,
      },
      include: REQUEST_DETAIL_INCLUDE,
    });

    return res.status(201).json({ message: "Заявка создана", request: created });
  } catch (err) {
    console.error("POST /requests error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /requests/my
router.get("/my", auth, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [items, total] = await prisma.$transaction([
      prisma.request.findMany({
        where: { createdById: req.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: REQUEST_LIST_SELECT,
      }),
      prisma.request.count({ where: { createdById: req.user.id } }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /requests/my error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /requests/map
router.get("/map", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const { priority, problemType, district } = req.query;

    const where = {
      status: { in: ["NEW", "IN_PROGRESS"] },
      isPublished: true,
    };

    const pr = validateOptionalEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) return res.status(400).json({ message: pr.error });
    if (pr.value) where.priority = pr.value;

    const pt = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) return res.status(400).json({ message: pt.error });
    if (pt.value) where.problemType = pt.value;

    const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });
    if (dist.value) where.district = dist.value;

    const items = await prisma.request.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
      select: {
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
        _count: {
          select: { volunteers: true },
        },
      },
    });

    const byDistrict = {};
    for (const item of items) {
      if (!byDistrict[item.district]) byDistrict[item.district] = [];
      byDistrict[item.district].push(item);
    }

    return res.json({
      total: items.length,
      items,
      byDistrict,
    });
  } catch (err) {
    console.error("GET /requests/map error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /requests/assigned
router.get("/assigned", auth, allowRoles("VOLUNTEER"), async (req, res) => {
  try {
    const { status, priority, problemType, district } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = { volunteers: { some: { volunteerId: req.user.id } } };

    const st = validateOptionalEnum(status, ALLOWED_STATUSES, "status");
    if (st.error) return res.status(400).json({ message: st.error });
    if (st.value) where.status = st.value;

    const pr = validateOptionalEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) return res.status(400).json({ message: pr.error });
    if (pr.value) where.priority = pr.value;

    const pt = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) return res.status(400).json({ message: pt.error });
    if (pt.value) where.problemType = pt.value;

    const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });
    if (dist.value) where.district = dist.value;

    const [items, total] = await prisma.$transaction([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: REQUEST_LIST_SELECT,
      }),
      prisma.request.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /requests/assigned error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /requests
router.get("/", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const { status, priority, problemType, district, search } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};

    const st = validateOptionalEnum(status, ALLOWED_STATUSES, "status");
    if (st.error) return res.status(400).json({ message: st.error });
    if (st.value) where.status = st.value;

    const pr = validateOptionalEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) return res.status(400).json({ message: pr.error });
    if (pr.value) where.priority = pr.value;

    const pt = validateOptionalEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) return res.status(400).json({ message: pt.error });
    if (pt.value) where.problemType = pt.value;

    const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });
    if (dist.value) where.district = dist.value;

    if (search && String(search).trim().length >= 2) {
      where.OR = [
        { title: { contains: String(search).trim(), mode: "insensitive" } },
        { address: { contains: String(search).trim(), mode: "insensitive" } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: REQUEST_LIST_SELECT,
      }),
      prisma.request.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /requests error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /requests/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: REQUEST_DETAIL_INCLUDE,
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    if (!canAccessRequest(req.user, request)) {
      return res.status(403).json({ message: "Недостаточно прав" });
    }

    return res.json(request);
  } catch (err) {
    console.error("GET /requests/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PUT /requests/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, createdById: true },
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    const isCoordinator = req.user.role === "COORDINATOR" || req.user.role === "ADMIN";
    const isOwner = request.createdById === req.user.id;

    if (!isCoordinator && !isOwner) {
      return res.status(403).json({ message: "Недостаточно прав" });
    }

    if (request.status === "DONE" || request.status === "CANCELLED") {
      return res.status(400).json({ message: "Нельзя редактировать закрытую заявку" });
    }

    const {
      title,
      description,
      priority,
      problemType,
      peopleCount,
      address,
      district,
      landmark,
      additionalInfo,
      contactName,
      contactPhone,
      contactEmail,
      contactTelegram,
      latitude,
      longitude,
    } = req.body || {};

    const data = {};

    if (title !== undefined) {
      const t = String(title).trim();
      if (t.length < 5 || t.length > 200)
        return res.status(400).json({ message: "Заголовок: от 5 до 200 символов" });
      data.title = t;
    }

    if (description !== undefined) {
      const d = String(description).trim();
      if (d.length < 50)
        return res.status(400).json({ message: "Описание: минимум 50 символов" });
      data.description = d;
    }

    if (priority !== undefined) {
      const pr = validateEnum(priority, ALLOWED_PRIORITIES, "priority");
      if (pr.error) return res.status(400).json({ message: pr.error });
      data.priority = pr.value;
    }

    if (problemType !== undefined) {
      const pt = validateEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
      if (pt.error) return res.status(400).json({ message: pt.error });
      data.problemType = pt.value;
    }

    if (district !== undefined) {
      const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
      if (dist.error) return res.status(400).json({ message: dist.error });
      data.district = dist.value;
    }

    if (peopleCount !== undefined) {
      const count = Number(peopleCount);
      if (isNaN(count) || count < 1 || count > 1000)
        return res.status(400).json({ message: "peopleCount: от 1 до 1000" });
      data.peopleCount = count;
    }

    if (address !== undefined) data.address = String(address).trim();
    if (landmark !== undefined) data.landmark = landmark ? String(landmark).trim() : null;
    if (additionalInfo !== undefined)
      data.additionalInfo = additionalInfo ? String(additionalInfo).trim() : null;
    if (contactName !== undefined) data.contactName = String(contactName).trim();
    if (contactPhone !== undefined) data.contactPhone = String(contactPhone).trim();
    if (contactEmail !== undefined) data.contactEmail = contactEmail || null;
    if (contactTelegram !== undefined) data.contactTelegram = contactTelegram || null;
    if (latitude !== undefined) data.latitude = latitude ? Number(latitude) : null;
    if (longitude !== undefined) data.longitude = longitude ? Number(longitude) : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data,
      include: REQUEST_DETAIL_INCLUDE,
    });

    return res.json({ message: "Заявка обновлена", request: updated });
  } catch (err) {
    console.error("PUT /requests/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PATCH /requests/:id/status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const { status: newStatus } = req.body || {};
    if (!newStatus) return res.status(400).json({ message: "status обязателен" });

    const sv = validateEnum(newStatus, ALLOWED_STATUSES, "status");
    if (sv.error) return res.status(400).json({ message: sv.error });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { volunteers: { select: { volunteer: { select: { id: true } } } } },
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    const allowed = STATUS_TRANSITIONS[request.status] || [];
    if (!allowed.includes(sv.value)) {
      return res.status(400).json({
        message: `Переход ${request.status} → ${sv.value} недопустим`,
      });
    }

    const isCoordinator = req.user.role === "COORDINATOR" || req.user.role === "ADMIN";
    const isOwner = request.createdById === req.user.id;
    const isAssignedVolunteer =
      req.user.role === "VOLUNTEER" &&
      request.volunteers.some((v) => v.volunteer.id === req.user.id);

    if (sv.value === "DONE") {
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостаточно прав для завершения" });
      }
    } else if (sv.value === "CANCELLED") {
      if (!isCoordinator && !isOwner) {
        return res.status(403).json({ message: "Недостаточно прав для отмены" });
      }
    } else {
      if (!isCoordinator) {
        return res.status(403).json({ message: "Недостаточно прав" });
      }
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: sv.value },
      include: REQUEST_DETAIL_INCLUDE,
    });

    if (sv.value === "DONE") {
      try {
        const { notifyRequestDone } = require("../services/telegramService");
        notifyRequestDone(updated).catch((e) =>
          console.error("Telegram notifyRequestDone error:", e)
        );
      } catch (_) {}
    }

    return res.json({ message: `Статус изменён на ${sv.value}`, request: updated });
  } catch (err) {
    console.error("PATCH /requests/:id/status error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /requests/:id/assign
router.post("/:id/assign", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const volunteerId = Number(req.body.volunteerId);

    if (!requestId || !volunteerId) {
      return res.status(400).json({ message: "volunteerId обязателен" });
    }

    const [request, volunteer] = await Promise.all([
      prisma.request.findUnique({
        where: { id: requestId },
        select: { id: true, status: true, title: true },
      }),
      prisma.user.findUnique({
        where: { id: volunteerId },
        select: { id: true, role: true, firstName: true, lastName: true, telegramChatId: true, telegramUsername: true },
      }),
    ]);

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });
    if (!volunteer || volunteer.role !== "VOLUNTEER") {
      return res.status(400).json({ message: "Пользователь не является волонтёром" });
    }

    if (request.status === "DONE" || request.status === "CANCELLED") {
      return res.status(400).json({
        message: "Нельзя назначать волонтёров на закрытую заявку",
      });
    }

    try {
      await prisma.requestVolunteer.create({ data: { requestId, volunteerId } });
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(400).json({ message: "Волонтёр уже назначен на эту заявку" });
      }
      throw e;
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: request.status === "NEW" ? { status: "IN_PROGRESS" } : {},
      include: REQUEST_DETAIL_INCLUDE,
    });

    try {
      const { notifyVolunteerAssigned } = require("../services/telegramService");
      notifyVolunteerAssigned(updated, volunteer).catch((e) =>
        console.error("Telegram notifyVolunteerAssigned error:", e)
      );
    } catch (_) {}

    return res.json({ message: "Волонтёр добавлен к заявке", request: updated });
  } catch (err) {
    console.error("POST /requests/:id/assign error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /requests/:id/assign/:volunteerId
router.delete(
  "/:id/assign/:volunteerId",
  auth,
  allowRoles("COORDINATOR", "ADMIN"),
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const volunteerId = Number(req.params.volunteerId);

      if (!requestId || !volunteerId) {
        return res.status(400).json({ message: "Неверные параметры" });
      }

      try {
        await prisma.requestVolunteer.delete({
          where: { requestId_volunteerId: { requestId, volunteerId } },
        });
      } catch (e) {
        if (e.code === "P2025") {
          return res.status(404).json({ message: "Назначение не найдено" });
        }
        throw e;
      }

      const [left, reqNow] = await Promise.all([
        prisma.requestVolunteer.count({ where: { requestId } }),
        prisma.request.findUnique({
          where: { id: requestId },
          select: { status: true },
        }),
      ]);

      const shouldRevert = reqNow?.status === "IN_PROGRESS" && left === 0;

      const updated = await prisma.request.update({
        where: { id: requestId },
        data: shouldRevert ? { status: "NEW" } : {},
        include: REQUEST_DETAIL_INCLUDE,
      });

      return res.json({ message: "Волонтёр снят с заявки", request: updated });
    } catch (err) {
      console.error("DELETE /requests/:id/assign/:volunteerId error:", err);
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// DELETE /requests/:id
router.delete("/:id", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    try {
      await prisma.request.delete({ where: { id: requestId } });
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ message: "Заявка не найдена" });
      throw e;
    }

    return res.json({ message: "Заявка удалена" });
  } catch (err) {
    console.error("DELETE /requests/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PATCH /requests/:id/publish
router.patch("/:id/publish", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, isPublished: true, status: true },
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    if (request.isPublished) {
      return res.status(400).json({ message: "Заявка уже опубликована" });
    }

    if (request.status === "CANCELLED") {
      return res.status(400).json({ message: "Нельзя опубликовать отменённую заявку" });
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedById: req.user.id,
      },
      include: REQUEST_DETAIL_INCLUDE,
    });

    try {
      const { notifyNewRequest } = require("../services/telegramService");
      notifyNewRequest(updated).catch((e) =>
        console.error("Telegram notifyNewRequest error:", e)
      );
    } catch (_) {
    }

    return res.json({ message: "Заявка опубликована", request: updated });
  } catch (err) {
    console.error("PATCH /requests/:id/publish error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PATCH /requests/:id/unpublish
router.patch("/:id/unpublish", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, isPublished: true, status: true },
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    if (!request.isPublished) {
      return res.status(400).json({ message: "Заявка и так не опубликована" });
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        isPublished: false,
        publishedAt: null,
        publishedById: null,
      },
      include: REQUEST_DETAIL_INCLUDE,
    });

    try {
      const { notifyRequestUnpublished } = require("../services/telegramService");
      notifyRequestUnpublished(updated).catch((e) =>
        console.error("Telegram notifyRequestUnpublished error:", e)
      );
    } catch (_) {}

    return res.json({ message: "Заявка снята с публикации", request: updated });
  } catch (err) {
    console.error("PATCH /requests/:id/unpublish error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /requests/:id/volunteer
router.post("/:id/volunteer", auth, allowRoles("VOLUNTEER"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, isPublished: true },
    });

    if (!request) return res.status(404).json({ message: "Заявка не найдена" });

    if (!request.isPublished) {
      return res.status(403).json({ message: "Заявка ещё не опубликована" });
    }

    if (request.status === "DONE" || request.status === "CANCELLED") {
      return res.status(400).json({ message: "Заявка уже закрыта" });
    }

    try {
      await prisma.requestVolunteer.create({
        data: { requestId, volunteerId: req.user.id },
      });
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(400).json({ message: "Вы уже записаны на эту заявку" });
      }
      throw e;
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: request.status === "NEW" ? { status: "IN_PROGRESS" } : {},
      include: REQUEST_DETAIL_INCLUDE,
    });

    try {
      const { notifyVolunteerAlreadyJoined } = require("../services/telegramService");
      notifyVolunteerAlreadyJoined(requestId, req.user.id).catch(() => {});
    } catch (_) {}

    return res.json({ message: "Вы записались на заявку", request: updated });
  } catch (err) {
    console.error("POST /requests/:id/volunteer error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /requests/:id/volunteer
router.delete("/:id/volunteer", auth, allowRoles("VOLUNTEER"), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId || requestId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    try {
      await prisma.requestVolunteer.delete({
        where: {
          requestId_volunteerId: { requestId, volunteerId: req.user.id },
        },
      });
    } catch (e) {
      if (e.code === "P2025") {
        return res.status(404).json({ message: "Вы не записаны на эту заявку" });
      }
      throw e;
    }

    const [left, reqNow] = await Promise.all([
      prisma.requestVolunteer.count({ where: { requestId } }),
      prisma.request.findUnique({
        where: { id: requestId },
        select: { status: true },
      }),
    ]);

    const shouldRevert = reqNow?.status === "IN_PROGRESS" && left === 0;

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: shouldRevert ? { status: "NEW" } : {},
      include: REQUEST_DETAIL_INCLUDE,
    });

    return res.json({ message: "Вы отписались от заявки", request: updated });
  } catch (err) {
    console.error("DELETE /requests/:id/volunteer error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;