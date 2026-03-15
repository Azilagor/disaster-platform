const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const prisma = require("../prismaClient");


// GET /api/dashboard
// Единый эндпоинт дашборда — возвращает данные в зависимости от роли


router.get("/", auth, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    if (role === "ADMIN" || role === "COORDINATOR") {
      // ── Координатор / Админ ───────────────────────────────
      const [
        totalRequests,
        newRequests,
        inProgressRequests,
        doneRequests,
        cancelledRequests,
        publishedRequests,
        totalVolunteers,
        activeIncidents,
        requestsByPriority,
        requestsByDistrict,
        recentRequests,
      ] = await prisma.$transaction([
        prisma.request.count(),
        prisma.request.count({ where: { status: "NEW" } }),
        prisma.request.count({ where: { status: "IN_PROGRESS" } }),
        prisma.request.count({ where: { status: "DONE" } }),
        prisma.request.count({ where: { status: "CANCELLED" } }),
        prisma.request.count({ where: { isPublished: true } }),
        prisma.user.count({ where: { role: "VOLUNTEER" } }),
        prisma.incident.count({ where: { status: { in: ["ACTIVE", "RESOLVING"] } } }),
        prisma.request.groupBy({
          by: ["priority"],
          _count: { id: true },
          where: { status: { in: ["NEW", "IN_PROGRESS"] } },
        }),
        prisma.request.groupBy({
          by: ["district"],
          _count: { id: true },
          where: { status: { in: ["NEW", "IN_PROGRESS"] } },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.request.findMany({
          where: { status: { in: ["NEW", "IN_PROGRESS"] } },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            problemType: true,
            district: true,
            isPublished: true,
            createdAt: true,
            _count: { select: { volunteers: true } },
          },
        }),
      ]);

      const priorityMap = Object.fromEntries(
        requestsByPriority.map((r) => [r.priority, r._count.id])
      );

      return res.json({
        role,
        requests: {
          total: totalRequests,
          new: newRequests,
          inProgress: inProgressRequests,
          done: doneRequests,
          cancelled: cancelledRequests,
          published: publishedRequests,
          byPriority: {
            CRITICAL: priorityMap.CRITICAL || 0,
            HIGH: priorityMap.HIGH || 0,
            MEDIUM: priorityMap.MEDIUM || 0,
            LOW: priorityMap.LOW || 0,
          },
          byDistrict: requestsByDistrict.map((r) => ({
            district: r.district,
            count: r._count.id,
          })),
        },
        volunteers: { total: totalVolunteers },
        incidents: { active: activeIncidents },
        recentRequests,
      });
    }

    if (role === "VOLUNTEER") {
      // ── Волонтёр ─────────────────────────────────────────
      const [
        assignedTotal,
        assignedInProgress,
        assignedDone,
        availableRequests,
        activeIncidents,
      ] = await prisma.$transaction([
        prisma.requestVolunteer.count({ where: { volunteerId: userId } }),
        prisma.request.count({
          where: {
            status: "IN_PROGRESS",
            volunteers: { some: { volunteerId: userId } },
          },
        }),
        prisma.request.count({
          where: {
            status: "DONE",
            volunteers: { some: { volunteerId: userId } },
          },
        }),
        prisma.request.findMany({
          where: { isPublished: true, status: { in: ["NEW", "IN_PROGRESS"] } },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            problemType: true,
            district: true,
            createdAt: true,
            _count: { select: { volunteers: true } },
          },
        }),
        prisma.incident.count({ where: { status: { in: ["ACTIVE", "RESOLVING"] } } }),
      ]);

      return res.json({
        role,
        myTasks: {
          total: assignedTotal,
          inProgress: assignedInProgress,
          done: assignedDone,
        },
        availableRequests,
        incidents: { active: activeIncidents },
      });
    }

    // ── Обычный пользователь (USER) ────────────────────────
    const [myRequests, activeIncidents] = await prisma.$transaction([
      prisma.request.findMany({
        where: { createdById: userId },
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
      }),
      prisma.incident.count({ where: { status: { in: ["ACTIVE", "RESOLVING"] } } }),
    ]);

    const myTotal      = await prisma.request.count({ where: { createdById: userId } });
    const myInProgress = await prisma.request.count({ where: { createdById: userId, status: "IN_PROGRESS" } });
    const myDone       = await prisma.request.count({ where: { createdById: userId, status: "DONE" } });

    return res.json({
      role,
      myRequests: {
        total: myTotal,
        inProgress: myInProgress,
        done: myDone,
        recent: myRequests,
      },
      incidents: { active: activeIncidents },
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;