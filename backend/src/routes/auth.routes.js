const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { auth } = require("../middleware/auth");
const prisma = require("../prismaClient");


const normalizeEmail = require("../utils/normalizeEmail");
const normalizePhone = require("../utils/normalizePhone");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const { sendVerificationEmail,sendResetPasswordEmail} = require("../services/emailService");
const { generateToken, hashToken } = require("../utils/emailTokens");

const validatePassword = require("../utils/validatePassword");
const { forgotPasswordLimiter,resetPasswordLimiter } = require("../middleware/rateLimiters")



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

  
    email = normalizeEmail(email);
    phone = normalizePhone(phone);

  
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

  

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    
    await prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      create: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const verifyLink = `${process.env.APP_BASE_URL}/auth/verify-email?token=${rawToken}`;

    await sendVerificationEmail(user.email, verifyLink);


    const payload = { userId: user.id };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      message: "Регистрация успешна. Проверьте почту для подтверждения.",
      user,
      token,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        message: "Email или телефон уже зарегистрирован",
      });
    }

    console.error("REGISTER error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.get("/verify-email", async (req, res) => {
  try {
    const rawToken = req.query.token;

    if (!rawToken || typeof rawToken !== "string") {
      return res.status(400).send("Invalid token");
    }

    const tokenHash = hashToken(rawToken);

    const record = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });

    if (!record) {
      return res.status(400).send("Token invalid");
    }

    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken
        .delete({ where: { userId: record.userId } })
        .catch(() => {});
      return res.status(400).send("Token expired");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      prisma.emailVerificationToken.delete({
        where: { userId: record.userId },
      }),
    ]);

    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/login.html?verified=1`
    );
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    return res.status(500).send("Server error");
  }
});

router.post("/resend-verification", auth, async (req, res) => {
  try {
    if (req.user.isEmailVerified) {
      return res.status(400).json({ message: "Email уже подтверждён" });
    }


    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, isEmailVerified: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email уже подтверждён" });
    }


    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    const verifyLink = `${process.env.APP_BASE_URL}/auth/verify-email?token=${rawToken}`;
    await sendVerificationEmail(user.email, verifyLink);

    return res.json({ message: "Письмо отправлено повторно" });
  } catch (err) {
    console.error("RESEND VERIFICATION error:", err);
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
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email обязателен" });
    }

    email = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    const safeResponse = {
      message: "Если аккаунт существует — мы отправили письмо для сброса пароля",
    };

    if (!user) {
      return res.json(safeResponse);
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    const resetLink = `${process.env.APP_BASE_URL}/auth/reset-password?token=${rawToken}`;

    await sendResetPasswordEmail(user.email, resetLink);

    return res.json(safeResponse);
  } catch (err) {
    console.error("FORGOT PASSWORD error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});


// GET /auth/reset-password?token=...
router.get("/reset-password", (req, res) => {
  const token = req.query.token;

  if (!token || typeof token !== "string") {
    return res.status(400).send("Invalid token");
  }

  return res.redirect(
    `${process.env.FRONTEND_BASE_URL}/reset-password.html?token=${encodeURIComponent(
      token
    )}`
  );
});

// POST /auth/reset-password
router.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "token и newPassword обязательны",
      });
    }
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return res.status(400).json({ message: pwdError });
    }

    const tokenHash = hashToken(String(token));

    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });

    if (!record) {
      return res.status(400).json({ message: "Неверный токен" });
    }

    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken
        .delete({ where: { userId: record.userId } })
        .catch(() => {});
      return res.status(400).json({ message: "Токен истёк" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
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

      await tx.passwordResetToken.delete({
        where: { userId: record.userId },
      });

      return u;
    });

    const payload = { userId: updatedUser.id };
    const jwtToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      message: "Пароль успешно изменён",
      user: updatedUser,
      token: jwtToken,
    });
  } catch (err) {
    console.error("RESET PASSWORD error:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
