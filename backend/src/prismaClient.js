require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const logger = require("./utils/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  logger.error("PG pool error", { message: err.message });
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Проверяет подключение к базе данных.
 * Вызывается один раз при старте сервера.
 * Бросает ошибку если БД недоступна — это нормально, сервер должен упасть.
 */
async function connectDB() {
  await prisma.$queryRaw`SELECT 1`;
  logger.info("✅ Database connected");
}

module.exports = prisma;
module.exports.connectDB = connectDB;