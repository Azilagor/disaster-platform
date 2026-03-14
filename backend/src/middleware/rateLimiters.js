const rateLimit = require("express-rate-limit");


const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Слишком много запросов. Попробуйте позже.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Слишком много попыток. Попробуйте позже.",
  },
});

module.exports = {
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
