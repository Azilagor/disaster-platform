const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const repo = require("../repositories/auth.repository");
const { sendVerificationEmail, sendResetPasswordEmail } = require("./emailService");
const { generateToken, hashToken } = require("../utils/emailTokens");
const validatePassword = require("../utils/validatePassword");
const normalizeEmail = require("../utils/normalizeEmail");
const normalizePhone = require("../utils/normalizePhone");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

const ALLOWED_SELF_REGISTER_ROLES = ["USER", "VOLUNTEER", "COORDINATOR"];
const ROLE_MAP = {
  user: "USER",
  volunteer: "VOLUNTEER",
  coordinator: "COORDINATOR",
  USER: "USER",
  VOLUNTEER: "VOLUNTEER",
  COORDINATOR: "COORDINATOR",
};


// Auth Service
// Бизнес-логика — не знает о req/res


function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function register({ firstName, lastName, email, phone, password, role }) {
  email = normalizeEmail(email);
  phone = normalizePhone(phone);

  const mappedRole = ROLE_MAP[role] || "USER";
  const safeRole = ALLOWED_SELF_REGISTER_ROLES.includes(mappedRole)
    ? mappedRole
    : "USER";

  const [existingEmail, existingPhone] = await Promise.all([
    repo.findByEmail(email),
    repo.findByPhone(phone),
  ]);

  if (existingEmail) {
    const err = new Error("Email уже зарегистрирован");
    err.status = 400;
    throw err;
  }

  if (existingPhone) {
    const err = new Error("Телефон уже зарегистрирован");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await repo.createUser({
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role: safeRole,
  });

  await _sendVerificationEmail(user.id, user.email);

  logger.info("User registered", { userId: user.id, email: user.email });

  return { email: user.email };
}

async function login({ email, password }) {
  email = normalizeEmail(email);

  const user = await repo.findByEmail(email);

  if (!user) {
    const err = new Error("Неверный email или пароль");
    err.status = 400;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const err = new Error("Неверный email или пароль");
    err.status = 400;
    throw err;
  }

  if (!user.isEmailVerified) {
    const err = new Error("Подтвердите email. Мы можем отправить письмо повторно.");
    err.status = 403;
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  const token = signToken(user.id);

  logger.info("User logged in", { userId: user.id });

  const { passwordHash: _, ...userWithoutHash } = user;
  return { user: userWithoutHash, token };
}

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);

  const record = await repo.findEmailVerificationToken(tokenHash);

  if (!record) {
    const err = new Error("invalidToken");
    err.code = "INVALID_TOKEN";
    throw err;
  }

  if (record.expiresAt < new Date()) {
    await repo.deleteEmailVerificationToken(record.userId);
    const err = new Error("tokenExpired");
    err.code = "TOKEN_EXPIRED";
    throw err;
  }

  await repo.confirmEmailVerification(record.userId);
  logger.info("Email verified", { userId: record.userId });
}

async function resendVerification(email) {
  email = normalizeEmail(email);

  const user = await repo.findByEmail(email);

  if (!user) return; // Не раскрываем существование аккаунта

  if (user.isEmailVerified) {
    const err = new Error("Email уже подтверждён");
    err.status = 400;
    throw err;
  }

  await _sendVerificationEmail(user.id, user.email);
}

async function forgotPassword(email) {
  email = normalizeEmail(email);

  const user = await repo.findByEmail(email);

  if (!user) return; // Не раскрываем существование аккаунта

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await repo.upsertPasswordResetToken(user.id, tokenHash, expiresAt);

  const resetLink = `${process.env.APP_BASE_URL}/api/auth/reset-password?token=${rawToken}`;
  await sendResetPasswordEmail(user.email, resetLink);
}

async function resetPassword({ token, newPassword }) {
  const pwdError = validatePassword(newPassword);
  if (pwdError) {
    const err = new Error(pwdError);
    err.status = 400;
    throw err;
  }

  const tokenHash = hashToken(String(token));
  const record = await repo.findPasswordResetToken(tokenHash);

  if (!record) {
    const err = new Error("Неверный токен");
    err.status = 400;
    throw err;
  }

  if (record.expiresAt < new Date()) {
    await repo.deletePasswordResetToken(record.userId);
    const err = new Error("Токен истёк");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updatedUser = await repo.resetPassword(record.userId, passwordHash);

  const jwtToken = signToken(updatedUser.id);
  logger.info("Password reset", { userId: updatedUser.id });

  return { user: updatedUser, token: jwtToken };
}

async function getMe(userId) {
  const user = await repo.findById(userId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.status = 404;
    throw err;
  }
  return user;
}

async function updateMe(userId, fields) {
  const { firstName, lastName, phone, telegramUsername, district } = fields;
  const data = {};

  if (firstName !== undefined) {
    const v = String(firstName).trim();
    if (v.length < 2) {
      const err = new Error("Имя слишком короткое");
      err.status = 400;
      throw err;
    }
    data.firstName = v;
  }

  if (lastName !== undefined) {
    const v = String(lastName).trim();
    if (v.length < 2) {
      const err = new Error("Фамилия слишком короткая");
      err.status = 400;
      throw err;
    }
    data.lastName = v;
  }

  if (phone !== undefined) {
    data.phone = normalizePhone(phone);
  }

  if (telegramUsername !== undefined) {
    const v = String(telegramUsername).trim().replace(/^@+/, "");
    if (!v) {
      data.telegramUsername = null;
    } else {
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(v)) {
        const err = new Error(
          "Telegram username некорректный (допустимы латиница/цифры/_ , 5-32)"
        );
        err.status = 400;
        throw err;
      }
      data.telegramUsername = v;
    }
  }

  if (district !== undefined) {
    if (!district) {
      data.district = null;
    } else {
      const ALLOWED = [
        "ALMALYNSKIY","AUEZOVSKIY","BOSTANDYQ","MEDEU",
        "NAURYZBAY","TURKSIB","ZHETYSU","ALATAU",
      ];
      const d = String(district).toUpperCase();
      if (!ALLOWED.includes(d)) {
        const err = new Error("Неверный район");
        err.status = 400;
        throw err;
      }
      data.district = d;
    }
  }

  if (Object.keys(data).length === 0) {
    const err = new Error("Нет данных для обновления");
    err.status = 400;
    throw err;
  }

  return repo.updateUser(userId, data);
}

async function deleteMe(userId, password) {
  const user = await repo.findByIdWithHash(userId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.status = 404;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const err = new Error("Неверный пароль");
    err.status = 400;
    throw err;
  }

  await repo.deleteUserWithRelations(userId);
  logger.info("User deleted account", { userId });
}

// ── Внутренняя вспомогательная функция ───────────────────────

async function _sendVerificationEmail(userId, email) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await repo.upsertEmailVerificationToken(userId, tokenHash, expiresAt);

  const verifyLink = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${rawToken}`;
  await sendVerificationEmail(email, verifyLink);
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  deleteMe,
};