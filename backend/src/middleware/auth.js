const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");


const JWT_SECRET = process.env.JWT_SECRET;

async function auth(req, res, next) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ message: "Ошибка конфигурации сервера" });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = Number(decoded.userId);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ message: "Неверный токен" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Пользователь не существует" });
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Токен истёк" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Неверный токен" });
    }

    console.error("AUTH middleware error:", err);
    return res.status(401).json({ message: "Неверный или истекший токен" });
  }
}

function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Недостаточно прав" });
    }

    return next();
  };
}

module.exports = { auth, allowRoles };
