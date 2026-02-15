function requireVerified(req, res, next) {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: "Подтвердите email",
    });
  }

  next();
}

module.exports = requireVerified;
