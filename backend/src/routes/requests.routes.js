const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const { auth, allowRoles } = require("../middleware/auth");

// ==============================
// ENUM VALUES (строгая проверка)
// ==============================

const ALLOWED_PROBLEM_TYPES = [
  "MEDICAL",
  "FOOD",
  "EVACUATION",
  "SHELTER",
  "REPAIR",
  "PSYCHOLOGICAL",
];

const ALLOWED_PRIORITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

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

function validateEnum(value, allowed, fieldName) {
  const upper = String(value || "").toUpperCase();
  if (!allowed.includes(upper)) {
    return { error: `Неверное значение для ${fieldName}` };
  }
  return { value: upper };
}

// ==============================
// POST /requests
// Создание заявки (только auth)
// ==============================

router.post("/", auth, async (req, res) => {
  try {
    let {
      problemType,
      title,
      description,
      priority,
      peopleCount,
      address,
      district,
      landmark,
      additionalInfo,
    } = req.body || {};

    if (!problemType || !title || !description || !priority || !address || !district) {
      return res.status(400).json({
        message: "problemType, title, description, priority, address, district обязательны",
      });
    }

    if (String(description).trim().length < 50) {
      return res.status(400).json({
        message: "Описание должно быть минимум 50 символов",
      });
    }

    // Проверка enum
    const pt = validateEnum(problemType, ALLOWED_PROBLEM_TYPES, "problemType");
    if (pt.error) return res.status(400).json({ message: pt.error });

    const pr = validateEnum(priority, ALLOWED_PRIORITIES, "priority");
    if (pr.error) return res.status(400).json({ message: pr.error });

    const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const created = await prisma.request.create({
      data: {
        problemType: pt.value,
        title: title.trim(),
        description: description.trim(),
        priority: pr.value,
        status: "NEW",

        peopleCount: Number(peopleCount) > 0 ? Number(peopleCount) : 1,
        address: address.trim(),
        district: dist.value,
        landmark: landmark ? landmark.trim() : null,

        contactName: `${user.firstName} ${user.lastName}`,
        contactPhone: user.phone,
        contactEmail: user.email,
        additionalInfo: additionalInfo ? additionalInfo.trim() : null,

        consentAt: new Date(),
        createdById: user.id,
      },
    });

    return res.status(201).json({
      message: "Заявка создана",
      request: created,
    });

  } catch (err) {
    console.error("CREATE REQUEST error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ==============================
// GET /requests/my
// Мои заявки
// ==============================

router.get("/my", auth, async (req, res) => {
  try {
    const items = await prisma.request.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(items);

  } catch (err) {
    console.error("MY REQUESTS error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ==============================
// GET /requests
// Для координатора и админа
// ==============================

router.get(
  "/",
  auth,
  allowRoles("COORDINATOR", "ADMIN"),
  async (req, res) => {
    try {
      const { status, priority, problemType, district } = req.query;

      const where = {};

      if (status) {
        const st = status.toUpperCase();
        where.status = st;
      }

      if (priority) {
        const pr = priority.toUpperCase();
        where.priority = pr;
      }

      if (problemType) {
        const pt = problemType.toUpperCase();
        where.problemType = pt;
      }

      if (district) {
        const dist = district.toUpperCase();
        where.district = dist;
      }

      const items = await prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return res.json(items);

    } catch (err) {
      console.error("LIST REQUESTS error:", err);
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// ==============================
// POST /requests/:id/assign
// Назначить волонтёра
// ==============================

router.post(
  "/:id/assign",
  auth,
  allowRoles("COORDINATOR", "ADMIN"),
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const volunteerId = Number(req.body.volunteerId);

      if (!requestId || !volunteerId) {
        return res.status(400).json({
          message: "requestId и volunteerId обязательны",
        });
      }

      const volunteer = await prisma.user.findUnique({
        where: { id: volunteerId },
      });

      if (!volunteer || volunteer.role !== "VOLUNTEER") {
        return res.status(400).json({
          message: "Пользователь не является волонтёром",
        });
      }

      const updated = await prisma.request.update({
        where: { id: requestId },
        data: {
          assignedToId: volunteerId,
          status: "IN_PROGRESS",
        },
      });

      return res.json({
        message: "Волонтёр назначен",
        request: updated,
      });

    } catch (err) {
      console.error("ASSIGN error:", err);
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// ==============================
// POST /requests/:id/complete
// Завершить заявку
// ==============================

router.post("/:id/complete", auth, async (req, res) => {
  try {
    const requestId = Number(req.params.id);

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ message: "Заявка не найдена" });
    }

    const isCoordinator =
      req.user.role === "COORDINATOR" ||
      req.user.role === "ADMIN";

    const isAssignedVolunteer =
      req.user.role === "VOLUNTEER" &&
      request.assignedToId === req.user.id;

    if (!isCoordinator && !isAssignedVolunteer) {
      return res.status(403).json({
        message: "Недостаточно прав",
      });
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: "DONE" },
    });

    return res.json({
      message: "Заявка завершена",
      request: updated,
    });

  } catch (err) {
    console.error("COMPLETE error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
