const authService = require("../services/auth.service");
const logger = require("../utils/logger");


// Auth Controller
// Только HTTP: читает req → вызывает service → пишет res
// Никакой бизнес-логики и Prisma здесь нет


async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const updated = await authService.updateMe(req.user.id, req.body || {});
    res.json({ message: "Профиль обновлён", user: updated });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Телефон уже используется" });
    }
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: "password обязателен" });
    }
    await authService.deleteMe(req.user.id, password);
    res.json({ message: "Аккаунт удалён" });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body || {};

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        message: "firstName, lastName, email, phone и password обязательные поля",
      });
    }

    const result = await authService.register({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
    });

    res.status(201).json({
      message: "Регистрация успешна. Проверьте почту для подтверждения.",
      email: result.email,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email или телефон уже зарегистрирован" });
    }
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const rawToken = req.query.token;

    if (!rawToken || typeof rawToken !== "string") {
      return res.redirect(`${process.env.FRONTEND_LOGIN_URL}?error=invalidToken`);
    }

    await authService.verifyEmail(rawToken);
    res.redirect(`${process.env.FRONTEND_LOGIN_URL}?verified=1`);
  } catch (err) {
    const code = err.code === "TOKEN_EXPIRED" ? "tokenExpired" : "invalidToken";
    res.redirect(`${process.env.FRONTEND_LOGIN_URL}?error=${code}`);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "email обязателен" });
    }
    await authService.resendVerification(email);
    res.json({
      message: "Если аккаунт существует — мы отправили письмо для подтверждения",
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email и пароль обязательные поля" });
    }

    const result = await authService.login({ email, password });
    res.status(200).json({ message: "Успешный вход", ...result });
  } catch (err) {
    if (err.code === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({ code: "EMAIL_NOT_VERIFIED", message: err.message });
    }
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "email обязателен" });
    }
    await authService.forgotPassword(email);
    res.json({
      message: "Если аккаунт существует — мы отправили письмо для сброса пароля",
    });
  } catch (err) {
    next(err);
  }
}

function resetPasswordRedirect(req, res) {
  const token = req.query.token;
  if (!token || typeof token !== "string") {
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/reset-password?error=invalidToken`
    );
  }
  res.redirect(
    `${process.env.FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`
  );
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: "token и newPassword обязательны" });
    }
    const result = await authService.resetPassword({ token, newPassword });
    res.json({ message: "Пароль успешно изменён", ...result });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не выбран" });
    }

    const prisma = require("../prismaClient");
    const path = require("path");
    const fs = require("fs");

    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });

    const newUrl = `/uploads/avatars/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: newUrl },
    });

    if (current?.avatarUrl?.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(__dirname, "..", "..", current.avatarUrl);
      fs.unlink(oldPath, () => {});
    }

    res.json({ message: "Аватар обновлён", avatarUrl: newUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPasswordRedirect,
  resetPassword,
  uploadAvatar,
};