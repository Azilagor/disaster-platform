const service = require("../services/requests.service");


// Requests Controller — только HTTP-слой


function _parseId(param) {
  const id = Number(param);
  return id > 0 ? id : null;
}

async function createRequest(req, res, next) {
  try {
    const request = await service.createRequest(req.user.id, req.body || {});
    res.status(201).json({ message: "Заявка создана", request });
  } catch (err) { next(err); }
}

async function listRequests(req, res, next) {
  try {
    res.json(await service.listRequests(req.query));
  } catch (err) { next(err); }
}

async function listMyRequests(req, res, next) {
  try {
    res.json(await service.listMyRequests(req.user.id, req.query));
  } catch (err) { next(err); }
}

async function listAssignedRequests(req, res, next) {
  try {
    res.json(await service.listAssignedRequests(req.user.id, req.query));
  } catch (err) { next(err); }
}

async function getMapRequests(req, res, next) {
  try {
    res.json(await service.getMapRequests(req.query));
  } catch (err) { next(err); }
}

async function getRequest(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    res.json(await service.getRequest(req.user, id));
  } catch (err) { next(err); }
}

async function updateRequest(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const request = await service.updateRequest(req.user, id, req.body || {});
    res.json({ message: "Заявка обновлена", request });
  } catch (err) { next(err); }
}

async function changeStatus(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status обязателен" });
    const request = await service.changeStatus(req.user, id, status);
    res.json({ message: `Статус изменён на ${status.toUpperCase()}`, request });
  } catch (err) { next(err); }
}

async function publishRequest(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const request = await service.publishRequest(req.user, id);
    res.json({ message: "Заявка опубликована", request });
  } catch (err) { next(err); }
}

async function unpublishRequest(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const request = await service.unpublishRequest(req.user, id);
    res.json({ message: "Заявка снята с публикации", request });
  } catch (err) { next(err); }
}

async function assignVolunteer(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    const volunteerId = Number(req.body?.volunteerId);
    if (!id || !volunteerId) return res.status(400).json({ message: "volunteerId обязателен" });
    const request = await service.assignVolunteer(id, volunteerId);
    res.json({ message: "Волонтёр добавлен к заявке", request });
  } catch (err) { next(err); }
}

async function unassignVolunteer(req, res, next) {
  try {
    const id          = _parseId(req.params.id);
    const volunteerId = _parseId(req.params.volunteerId);
    if (!id || !volunteerId) return res.status(400).json({ message: "Неверные параметры" });
    const request = await service.unassignVolunteer(id, volunteerId);
    res.json({ message: "Волонтёр снят с заявки", request });
  } catch (err) { next(err); }
}

async function volunteerJoin(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const request = await service.volunteerJoin(req.user, id);
    res.json({ message: "Вы записались на заявку", request });
  } catch (err) { next(err); }
}

async function volunteerLeave(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const request = await service.volunteerLeave(req.user, id);
    res.json({ message: "Вы отписались от заявки", request });
  } catch (err) { next(err); }
}

async function deleteRequest(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    await service.deleteRequest(id);
    res.json({ message: "Заявка удалена" });
  } catch (err) { next(err); }
}


async function linkToIncident(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });

    const { incidentId } = req.body || {};
    const parsedIncidentId = incidentId === null || incidentId === undefined
      ? null
      : Number(incidentId);

    if (parsedIncidentId !== null && (isNaN(parsedIncidentId) || parsedIncidentId <= 0)) {
      return res.status(400).json({ message: "Неверный incidentId" });
    }

    const request = await service.linkToIncident(req.user, id, parsedIncidentId);
    const msg = parsedIncidentId
      ? `Заявка привязана к инциденту #${parsedIncidentId}`
      : "Заявка откреплена от инцидента";
    res.json({ message: msg, request });
  } catch (err) { next(err); }
}

module.exports = {
  createRequest, listRequests, listMyRequests,
  listAssignedRequests, getMapRequests,
  getRequest, updateRequest, changeStatus,
  publishRequest, unpublishRequest,
  assignVolunteer, unassignVolunteer,
  volunteerJoin, volunteerLeave,
  deleteRequest,
  linkToIncident,
};