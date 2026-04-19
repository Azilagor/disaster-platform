const service = require("../services/users.service");

function _parseId(p) { const id = Number(p); return id > 0 ? id : null; }

async function listUsers(req, res, next) {
  try { res.json(await service.listUsers(req.query)); }
  catch (err) { next(err); }
}
async function listVolunteers(req, res, next) {
  try { res.json(await service.listVolunteers(req.query)); }
  catch (err) { next(err); }
}
async function getStats(req, res, next) {
  try { res.json(await service.getStats()); }
  catch (err) { next(err); }
}
async function getAdminOverview(req, res, next) {
  try { res.json(await service.getAdminOverview()); }
  catch (err) { next(err); }
}
async function getUser(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    res.json(await service.getUser(id));
  } catch (err) { next(err); }
}
async function changeRole(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ message: "role обязателен" });
    const user = await service.changeRole(req.user.id, id, role);
    res.json({ message: `Роль изменена на ${role.toUpperCase()}`, user });
  } catch (err) { next(err); }
}
async function updateUser(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    const user = await service.updateUser(req.user.id, id, req.body || {});
    res.json({ message: "Пользователь обновлён", user });
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "Email или телефон уже используется" });
    next(err);
  }
}
async function deleteUser(req, res, next) {
  try {
    const id = _parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Неверный id" });
    await service.deleteUser(req.user.id, id);
    res.json({ message: "Пользователь удалён" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Пользователь не найден" });
    next(err);
  }
}

module.exports = {
  listUsers, listVolunteers, getStats, getAdminOverview,
  getUser, changeRole, updateUser, deleteUser,
};