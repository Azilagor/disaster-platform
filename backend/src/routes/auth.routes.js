const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { auth } = require("../middleware/auth");
const {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middleware/rateLimiters");
const controller = require("../controllers/auth.controller");


// Auth Routes
// Только маршруты — вся логика в controller и service


// Профиль текущего пользователя
router.get("/me",    auth, controller.getMe);
router.put("/me",    auth, controller.updateMe);
router.delete("/me", auth, controller.deleteMe);

// Регистрация и верификация email
router.post("/register",             controller.register);
router.get("/verify-email",          controller.verifyEmail);
router.post("/resend-verification",  controller.resendVerification);

// Вход
router.post("/login", controller.login);

// Сброс пароля
router.post("/forgot-password", forgotPasswordLimiter, controller.forgotPassword);
router.get("/reset-password",   controller.resetPasswordRedirect);
router.post("/reset-password",  resetPasswordLimiter, controller.resetPassword);

// Аватар
router.post("/avatar", auth, _buildAvatarUpload(), controller.uploadAvatar);


// Внутренняя функция настройки multer для аватаров


function _buildAvatarUpload() {
  const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads", "avatars");
  fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
      cb(null, `u${req.user.id}_${Date.now()}${safeExt}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Неверный формат файла"), ok);
  };

  const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

  return (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) {
        const httpErr = new Error(err.message || "Ошибка загрузки файла");
        httpErr.status = 400;
        return next(httpErr);
      }
      next();
    });
  };
}

module.exports = router;