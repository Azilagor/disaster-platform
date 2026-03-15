const express = require("express");
const router  = express.Router();
const { auth, allowRoles } = require("../middleware/auth");
const c = require("../controllers/requests.controller");

// Специфичные маршруты — до /:id
router.get("/my",       auth,                              c.listMyRequests);
router.get("/map",      auth,                              c.getMapRequests);
router.get("/assigned", auth, allowRoles("VOLUNTEER"),     c.listAssignedRequests);

// CRUD
router.get("/",   auth, allowRoles("COORDINATOR", "ADMIN"), c.listRequests);
router.post("/",  auth,                                     c.createRequest);
router.get("/:id",  auth,                                   c.getRequest);
router.put("/:id",  auth,                                   c.updateRequest);
router.delete("/:id", auth, allowRoles("ADMIN"),            c.deleteRequest);

// Действия над заявкой
router.patch("/:id/status",    auth,                              c.changeStatus);
router.patch("/:id/publish",   auth, allowRoles("COORDINATOR", "ADMIN"), c.publishRequest);
router.patch("/:id/incident",   auth, allowRoles("COORDINATOR", "ADMIN"), c.linkToIncident);
router.patch("/:id/unpublish", auth, allowRoles("COORDINATOR", "ADMIN"), c.unpublishRequest);

// Волонтёры
router.post("/:id/assign",                  auth, allowRoles("COORDINATOR", "ADMIN"), c.assignVolunteer);
router.delete("/:id/assign/:volunteerId",   auth, allowRoles("COORDINATOR", "ADMIN"), c.unassignVolunteer);
router.post("/:id/volunteer",               auth, allowRoles("VOLUNTEER"),            c.volunteerJoin);
router.delete("/:id/volunteer",             auth, allowRoles("VOLUNTEER"),            c.volunteerLeave);

module.exports = router;