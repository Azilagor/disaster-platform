const express = require("express");
const router = express.Router();

const { auth, allowRoles } = require("../middleware/auth");
const activityService = require("../services/activity.service");
const usersService = require("../services/users.service");

// Все маршруты /admin/* требуют ADMIN роли
router.use(auth, allowRoles("ADMIN"));


// GET /admin/logs — лог активности

// Query: action, entityType, userId, page, limit

router.get("/logs", async (req, res, next) => {
  try {
    res.json(await activityService.getLogs(req.query));
  } catch (err) {
    next(err);
  }
});


// GET /admin/users — список пользователей (алиас для ADMIN)


router.get("/users", async (req, res, next) => {
  try {
    res.json(await usersService.listUsers(req.query));
  } catch (err) {
    next(err);
  }
});


// PATCH /admin/users/:id/role — смена роли пользователя


router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || userId <= 0) {
      return res.status(400).json({ message: "Неверный id" });
    }
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ message: "role обязателен" });

    const user = await usersService.changeRole(req.user.id, userId, role);

    // Логируем смену роли
    await activityService.log({
      action: "USER_ROLE_CHANGED",
      entityType: "user",
      entityId: userId,
      meta: { newRole: role.toUpperCase() },
      userId: req.user.id,
    });

    res.json({ message: `Роль изменена на ${role.toUpperCase()}`, user });
  } catch (err) {
    next(err);
  }
});


// GET /admin/overview — сводная статистика (алиас)


router.get("/overview", async (req, res, next) => {
  try {
    res.json(await usersService.getAdminOverview());
  } catch (err) {
    next(err);
  }
});

module.exports = router;