const service = require("../services/incidents.service");

function _parseId(p) { const id = Number(p); return id > 0 ? id : null; }

async function listIncidents(req, res, next) {
  try { res.json(await service.listIncidents(req.query)); }
  catch (err) { next(err); }
}
async function listActiveIncidents(req, res, next) {
  try { res.json(await service.listActiveIncidents(req.query)); }
  catch (err) { next(err); }
}
async function getIncident(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    res.json(await service.getIncident(id));
  } catch (err) { next(err); }
}
async function createIncident(req, res, next) {
  try {
    const incident = await service.createIncident(req.user.id, req.body || {});
    res.status(201).json({ message: "Инцидент создан", incident });
  } catch (err) { next(err); }
}
async function updateIncident(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const incident = await service.updateIncident(id, req.body || {});
    res.json({ message: "Инцидент обновлён", incident });
  } catch (err) { next(err); }
}
async function changeStatus(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status обязателен" });
    const incident = await service.changeStatus(id, status);
    res.json({ message: `Статус изменён на ${status.toUpperCase()}`, incident });
  } catch (err) { next(err); }
}
async function deleteIncident(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    await service.deleteIncident(id);
    res.json({ message: "Инцидент удалён" });
  } catch (err) { next(err); }
}

module.exports = {
  listIncidents, listActiveIncidents, getIncident,
  createIncident, updateIncident, changeStatus, deleteIncident,
};