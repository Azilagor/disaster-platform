const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { auth } = require("../middleware/auth");
const prisma = require("../prisma");

const normalizeEmail = require("../utils/normalizeEmail");
const normalizePhone = require("../utils/normalizePhone");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";


const ALLOWED_SELF_REGISTER_ROLES = ["USER", "VOLUNTEER", "COORDINATOR"];
const ROLE_MAP = {
  user: "USER",
  volunteer: "VOLUNTEER",
  coordinator: "COORDINATOR",
  USER: "USER",
  VOLUNTEER: "VOLUNTEER",
  COORDINATOR: "COORDINATOR",
};

// GET /auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.json(user);
  } catch (err) {
    console.error("/me error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, email, phone, password, role } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        message:
          "firstName, lastName, email, phone и password обязательные поля",
      });
    }

    // ✅ нормализация ДО проверок уникальности
    email = normalizeEmail(email);
    phone = normalizePhone(phone);

    // ✅ роль: маппинг + whitelist (ADMIN не дадим)
    const mappedRole = ROLE_MAP[role] || "USER";
    const safeRole = ALLOWED_SELF_REGISTER_ROLES.includes(mappedRole)
      ? mappedRole
      : "USER";

    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email уже зарегистрирован" });
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existingPhone) {
      return res.status(400).json({ message: "Телефон уже зарегистрирован" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role: safeRole,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // ✅ JWT: только userId + ✅ expiresIn (срок жизни НЕ забыли)
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      message: "Регистрация успешна",
      user,
      token,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Email или телефон уже зарегистрирован" });
    }

    console.error("REGISTER error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email и пароль обязательные поля" });
    }

    // ✅ нормализация email и при логине
    email = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    // ✅ JWT: только userId + ✅ expiresIn
    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      message: "Успешный вход",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role, // роль отдаём в ответе — это норм
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
