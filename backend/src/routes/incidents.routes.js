const express = require("express");
const router  = express.Router();
const { auth, allowRoles } = require("../middleware/auth");
const c = require("../controllers/incidents.controller");

// Публичные (без авторизации — инциденты видны всем)
router.get("/",       c.listIncidents);
router.get("/active", c.listActiveIncidents);
router.get("/:id",    c.getIncident);

// Только для координатора и выше
router.post("/",          auth, allowRoles("COORDINATOR", "ADMIN"), c.createIncident);
router.put("/:id",        auth, allowRoles("COORDINATOR", "ADMIN"), c.updateIncident);
router.patch("/:id/status", auth, allowRoles("COORDINATOR", "ADMIN"), c.changeStatus);
router.delete("/:id",     auth, allowRoles("ADMIN"),                c.deleteIncident);

module.exports = router;