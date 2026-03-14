function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ message: "Подтвердите email" });
  }

  next();
}

module.exports = requireVerifiedEmail;
