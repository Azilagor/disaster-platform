const express = require("express");
const router  = express.Router();
const { auth, allowRoles } = require("../middleware/auth");
const c = require("../controllers/users.controller");

// Специфичные маршруты — до /:id
router.get("/volunteers",     auth, allowRoles("COORDINATOR", "ADMIN"), c.listVolunteers);
router.get("/stats",          auth, allowRoles("COORDINATOR", "ADMIN"), c.getStats);
router.get("/admin/overview", auth, allowRoles("ADMIN"),                c.getAdminOverview);

// CRUD
router.get("/",     auth, allowRoles("COORDINATOR", "ADMIN"), c.listUsers);
router.get("/:id",  auth, allowRoles("COORDINATOR", "ADMIN"), c.getUser);
router.put("/:id",  auth, allowRoles("ADMIN"),                c.updateUser);
router.delete("/:id", auth, allowRoles("ADMIN"),              c.deleteUser);

// Смена роли
router.patch("/:id/role", auth, allowRoles("ADMIN"), c.changeRole);

module.exports = router;  