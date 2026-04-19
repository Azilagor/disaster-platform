
// ВАЖНО: process.on должны быть ПЕРВЫМИ — до любых require,
// которые могут выбросить синхронное исключение.

const logger = require("./src/utils/logger");

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION — сервер завершает работу", {
    message: err.message,
    stack: err.stack,
  });
  // Даём время записать лог в файл, затем принудительно выходим
  setTimeout(() => process.exit(1), 500);
});

process.on("unhandledRejection", (reason) => {
  logger.error("UNHANDLED REJECTION", {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Не завершаем процесс — это позволяет серверу продолжить работу,
  // но ошибка будет записана и видна в логах
});


// Все остальные импорты — после регистрации обработчиков


const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const prismaClient = require("./src/prismaClient");


// Swagger — безопасная загрузка (сервер не падает если файла нет)


let swaggerFile = null;
try {
  swaggerFile = require("./swagger-output.json");
} catch {
  logger.warn("swagger-output.json не найден — Swagger UI будет недоступен. Запустите: npm run swagger");
}


// Express app


const app = express();
const PORT = process.env.PORT || 3000;

// ── Безопасность ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.set("trust proxy", true);

// ── Парсинг тела запроса ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP-логирование через morgan → winston ─────────────────
morgan.token("statusColor", (_req, res) => {
  const s = res.statusCode;
  if (s >= 500) return `\x1b[31m${s}\x1b[0m`; // red
  if (s >= 400) return `\x1b[33m${s}\x1b[0m`; // yellow
  return `\x1b[32m${s}\x1b[0m`;               // green
});

app.use(
  morgan(":method :url :statusColor :response-time ms", {
    // Пишем через winston, чтобы попадало в файлы логов
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ── Статика для загруженных файлов ──────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Swagger UI


const swaggerUi = require("swagger-ui-express");

if (swaggerFile) {
  app.get("/api-docs/swagger.json", (req, res) => {
    const fixed = { ...swaggerFile };
    fixed.host = req.get("host");
    const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http")
      .toString()
      .split(",")[0]
      .trim();
    fixed.schemes = [proto];
    res.setHeader("Content-Type", "application/json");
    res.send(fixed);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        urls: [{ url: "/api-docs/swagger.json", name: "API" }],
        urlsPrimaryName: "API",
      },
    })
  );
}


// Health check


app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "disaster-platform-api" });
});


// Маршруты API


app.use("/api/auth",      require("./src/routes/auth.routes"));
app.use("/api/requests",  require("./src/routes/requests.routes"));
app.use("/api/users",     require("./src/routes/users.routes"));
app.use("/api/incidents", require("./src/routes/incidents.routes"));
app.use("/api/admin",     require("./src/routes/admin.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api",           require("./src/routes/public.routes"));



// Telegram Bot (инициализация после маршрутов)


try {
  require("./src/services/telegramService");
  logger.info("✅ Telegram bot initialized");
} catch (err) {
  logger.warn("Telegram bot не инициализирован", { message: err.message });
}


// NEWS SCRAPER — cron + первый запуск при старте


const cron = require("node-cron");
const { scrapeNews } = require("./src/services/newsScraper.service");

// Первый запуск через 5 сек после старта
setTimeout(() => scrapeNews().catch(() => {}), 5000);

// Каждый день в 06:00
cron.schedule("0 6 * * *", () => {
  logger.info("⏰ Cron: запуск ежедневного парсинга новостей");
  scrapeNews().catch((e) => logger.error("Cron scrape failed", { message: e.message }));
});


// 404


app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});


// Центральный обработчик ошибок Express
// (4 аргумента — обязательно, иначе Express не распознаёт как error middleware)


// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error("Express unhandled error", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: status === 500 ? "Внутренняя ошибка сервера" : err.message,
  });
});


// Запуск сервера — через async функцию, чтобы await на БД


async function startServer() {
  logger.info("🚀 Запуск сервера...");

  // Сначала проверяем БД — если нет соединения, смысла стартовать нет
  await prismaClient.$queryRaw`SELECT 1`;
  logger.info("✅ Database connected");

  const server = app.listen(PORT, () => {
    logger.info("=".repeat(45));
    logger.info(`🌐 Сервер запущен на порту ${PORT}`);
    logger.info(`📡 API: http://localhost:${PORT}/api`);
    logger.info(`📖 Docs: http://localhost:${PORT}/api-docs`);
    logger.info(`📌 PID: ${process.pid}`);
    logger.info("=".repeat(45));
  });
  // ── Крон: парсинг новостей раз в день в 06:00 ───────────────
  // try {
  //   const cron = require("node-cron");
  //   const { runScraper } = require("./src/services/newsScraper.service");

  //   // Запуск при старте сервера (чтобы сразу были данные)
  //   runScraper().catch((e) =>
  //     logger.warn("Initial news scrape failed", { message: e.message })
  //   );

  //   // Каждый день в 06:00
  //   cron.schedule("0 6 * * *", () => {
  //     logger.info("Cron: running daily news scrape");
  //     runScraper().catch((e) =>
  //       logger.error("Cron news scrape failed", { message: e.message })
  //     );
  //   });

  //   logger.info("✅ News scraper cron scheduled (daily 06:00)");
  // } catch (err) {
  //   logger.warn("News scraper cron not started", { message: err.message });
  // }


  // ── Graceful shutdown ──────────────────────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} получен — завершение работы...`);
    server.close(() => {
      logger.info("✅ Сервер корректно остановлен");
      process.exit(0);
    });
    // Принудительный выход если shutdown завис
    setTimeout(() => {
      logger.error("❌ Принудительное завершение (timeout)");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  logger.error("❌ Не удалось запустить сервер", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});