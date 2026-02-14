function normalizePhone(phone) {
  if (!phone) return phone;
  return phone.trim().replace(/[^\d+]/g, "");
}

module.exports = normalizePhone;
