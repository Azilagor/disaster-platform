const express = require("express");
const router = express.Router();

const prisma = require("../prismaClient");
const { auth, allowRoles } = require("../middleware/auth");

const ALLOWED_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const ALLOWED_STATUSES = ["ACTIVE", "RESOLVING", "RESOLVED"];

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

const STATUS_TRANSITIONS = {
  ACTIVE: ["RESOLVING", "RESOLVED"],
  RESOLVING: ["RESOLVED", "ACTIVE"],
  RESOLVED: [],
};

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

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

const INCIDENT_LIST_SELECT = {
  id: true,
  title: true,
  severity: true,
  status: true,
  district: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
};

const INCIDENT_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  district: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
};

// GET /incidents
router.get("/", async (req, res) => {
  try {
    const { severity, status, district } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {};

    const sv = validateOptionalEnum(severity, ALLOWED_SEVERITIES, "severity");
    if (sv.error) return res.status(400).json({ message: sv.error });
    if (sv.value) where.severity = sv.value;

    const st = validateOptionalEnum(status, ALLOWED_STATUSES, "status");
    if (st.error) return res.status(400).json({ message: st.error });
    if (st.value) where.status = st.value;

    const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });
    if (dist.value) where.district = dist.value;

    const [items, total] = await prisma.$transaction([
      prisma.incident.findMany({
        where,
        orderBy: [
          { status: "asc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip,
        select: INCIDENT_LIST_SELECT,
      }),
      prisma.incident.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error("GET /incidents error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /incidents/active
router.get("/active", async (req, res) => {
  try {
    const { district } = req.query;
    const where = { status: { in: ["ACTIVE", "RESOLVING"] } };

    const dist = validateOptionalEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });
    if (dist.value) where.district = dist.value;

    const items = await prisma.incident.findMany({
      where,
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      select: INCIDENT_LIST_SELECT,
    });

    return res.json(items);
  } catch (err) {
    console.error("GET /incidents/active error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /incidents/:id
router.get("/:id", async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    if (!incidentId || incidentId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: INCIDENT_DETAIL_SELECT,
    });

    if (!incident) return res.status(404).json({ message: "Инцидент не найден" });

    return res.json(incident);
  } catch (err) {
    console.error("GET /incidents/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /incidents
router.post("/", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const { title, description, severity, district } = req.body || {};

    if (!title || !description || !severity || !district) {
      return res.status(400).json({
        message: "Обязательные поля: title, description, severity, district",
      });
    }

    const trimmedTitle = String(title).trim();
    const trimmedDesc = String(description).trim();

    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      return res.status(400).json({ message: "Заголовок: от 5 до 200 символов" });
    }

    if (trimmedDesc.length < 20) {
      return res.status(400).json({ message: "Описание: минимум 20 символов" });
    }

    const sv = validateEnum(severity, ALLOWED_SEVERITIES, "severity");
    if (sv.error) return res.status(400).json({ message: sv.error });

    const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
    if (dist.error) return res.status(400).json({ message: dist.error });

    const incident = await prisma.incident.create({
      data: {
        title: trimmedTitle,
        description: trimmedDesc,
        severity: sv.value,
        status: "ACTIVE",
        district: dist.value,
        createdById: req.user.id,
      },
      select: INCIDENT_DETAIL_SELECT,
    });

    try {
      const { notifyNewIncident } = require("../services/telegramService");
      notifyNewIncident(incident).catch((e) =>
        console.error("Telegram notifyNewIncident error:", e)
      );
    } catch (_) {
    }

    return res.status(201).json({ message: "Инцидент создан", incident });
  } catch (err) {
    console.error("POST /incidents error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PUT /incidents/:id
router.put("/:id", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    if (!incidentId || incidentId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const existing = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) return res.status(404).json({ message: "Инцидент не найден" });

    if (existing.status === "RESOLVED") {
      return res.status(400).json({ message: "Нельзя редактировать завершённый инцидент" });
    }

    const { title, description, severity, district } = req.body || {};
    const data = {};

    if (title !== undefined) {
      const t = String(title).trim();
      if (t.length < 5 || t.length > 200)
        return res.status(400).json({ message: "Заголовок: от 5 до 200 символов" });
      data.title = t;
    }

    if (description !== undefined) {
      const d = String(description).trim();
      if (d.length < 20)
        return res.status(400).json({ message: "Описание: минимум 20 символов" });
      data.description = d;
    }

    if (severity !== undefined) {
      const sv = validateEnum(severity, ALLOWED_SEVERITIES, "severity");
      if (sv.error) return res.status(400).json({ message: sv.error });
      data.severity = sv.value;
    }

    if (district !== undefined) {
      const dist = validateEnum(district, ALLOWED_DISTRICTS, "district");
      if (dist.error) return res.status(400).json({ message: dist.error });
      data.district = dist.value;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data,
      select: INCIDENT_DETAIL_SELECT,
    });

    return res.json({ message: "Инцидент обновлён", incident: updated });
  } catch (err) {
    console.error("PUT /incidents/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PATCH /incidents/:id/status
router.patch("/:id/status", auth, allowRoles("COORDINATOR", "ADMIN"), async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    if (!incidentId || incidentId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    const { status: newStatus } = req.body || {};
    if (!newStatus) return res.status(400).json({ message: "status обязателен" });

    const sv = validateEnum(newStatus, ALLOWED_STATUSES, "status");
    if (sv.error) return res.status(400).json({ message: sv.error });

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { id: true, status: true, title: true, district: true },
    });

    if (!incident) return res.status(404).json({ message: "Инцидент не найден" });

    const allowed = STATUS_TRANSITIONS[incident.status] || [];
    if (!allowed.includes(sv.value)) {
      return res.status(400).json({
        message: `Переход ${incident.status} → ${sv.value} недопустим`,
      });
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: { status: sv.value },
      select: INCIDENT_DETAIL_SELECT,
    });

    try {
      const { notifyIncidentStatusChanged } = require("../services/telegramService");
      notifyIncidentStatusChanged(updated, incident.status).catch((e) =>
        console.error("Telegram notifyIncidentStatusChanged error:", e)
      );
    } catch (_) {
    }

    return res.json({ message: `Статус изменён на ${sv.value}`, incident: updated });
  } catch (err) {
    console.error("PATCH /incidents/:id/status error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /incidents/:id
router.delete("/:id", auth, allowRoles("ADMIN"), async (req, res) => {
  try {
    const incidentId = Number(req.params.id);
    if (!incidentId || incidentId <= 0)
      return res.status(400).json({ message: "Неверный id" });

    try {
      await prisma.incident.delete({ where: { id: incidentId } });
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ message: "Инцидент не найден" });
      throw e;
    }

    return res.json({ message: "Инцидент удалён" });
  } catch (err) {
    console.error("DELETE /incidents/:id error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;