function normalizeEmail(email) {
  if (!email) return email;
  return email.trim().toLowerCase();
}

module.exports = normalizeEmail;
