// scripts/seed-admin.js
// Запуск: node scripts/seed-admin.js
// или добавь в package.json: "seed:admin": "node scripts/seed-admin.js"

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// ==============================
// КОНФИГ АДМИНА — берём из .env
// ==============================
// Добавь в .env:
//   ADMIN_EMAIL=admin@example.com
//   ADMIN_PASSWORD=<надёжный пароль 8+ символов>
//   ADMIN_FIRST_NAME=Admin
//   ADMIN_LAST_NAME=System
//   ADMIN_PHONE=+70000000000

const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_FIRST_NAME = "Admin",
  ADMIN_LAST_NAME  = "System",
  ADMIN_PHONE      = "+70000000000",
  DATABASE_URL,
} = process.env;

// ==============================
// ВАЛИДАЦИЯ
// ==============================

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL не задан в .env");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Задай ADMIN_EMAIL и ADMIN_PASSWORD в .env");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error("❌ ADMIN_PASSWORD должен быть минимум 8 символов");
  process.exit(1);
}

// ==============================
// SEED
// ==============================

async function seedAdmin() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("PG pool error:", err);
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const phone = ADMIN_PHONE.trim();

    // Проверяем — вдруг такой уже есть
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (existing) {
      if (existing.role === "ADMIN") {
        console.log(`ℹ️  Админ с email ${email} уже существует (id=${existing.id}). Ничего не делаем.`);
        return;
      }

      // Есть юзер с таким email но не админ — повышаем
      const updated = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN", isEmailVerified: true },
        select: { id: true, email: true, role: true },
      });

      console.log(`✅ Пользователь повышен до ADMIN:`);
      console.log(`   id:    ${updated.id}`);
      console.log(`   email: ${updated.email}`);
      console.log(`   role:  ${updated.role}`);
      return;
    }

    // Проверяем уникальность телефона
    const phoneExists = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (phoneExists) {
      console.error(`❌ Телефон ${phone} уже занят. Укажи другой в ADMIN_PHONE`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
      data: {
        firstName:       ADMIN_FIRST_NAME.trim(),
        lastName:        ADMIN_LAST_NAME.trim(),
        email,
        phone,
        passwordHash,
        role:            "ADMIN",
        isEmailVerified: true, // Админу не нужно подтверждать email
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
        phone:     true,
        role:      true,
      },
    });

    console.log("✅ Админ создан успешно:");
    console.log(`   id:       ${admin.id}`);
    console.log(`   name:     ${admin.firstName} ${admin.lastName}`);
    console.log(`   email:    ${admin.email}`);
    console.log(`   phone:    ${admin.phone}`);
    console.log(`   role:     ${admin.role}`);
    console.log("");
    console.log("🔐 Войди через POST /api/auth/login с этими данными.");

  } catch (err) {
    if (err.code === "P2002") {
      console.error("❌ Email или телефон уже используется");
    } else {
      console.error("❌ Ошибка:", err.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedAdmin();