const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const morgan = require("morgan");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

morgan.token("statusColor", function (req, res) {
  const status = res.statusCode;
  if (status >= 500) return "\x1b[31m" + status + "\x1b[0m"; // red
  if (status >= 400) return "\x1b[33m" + status + "\x1b[0m"; // yellow
  if (status >= 200) return "\x1b[32m" + status + "\x1b[0m"; // green
  return status;
});

app.use(morgan(":method :url :statusColor :response-time ms"));

const helmet = require("helmet");
app.use(helmet());

app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 3000;

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.set("trust proxy", true);

// ==============================
// SWAGGER
// ==============================

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

// ==============================
// ROUTES
// ==============================

const authRoutes = require("./src/routes/auth.routes");
app.use("/api/auth", authRoutes);

const requestRoutes = require("./src/routes/requests.routes");
app.use("/api/requests", requestRoutes);

const userRoutes = require("./src/routes/users.routes");
app.use("/api/users", userRoutes);

const incidentRoutes = require("./src/routes/incidents.routes");
app.use("/api/incidents", incidentRoutes);

// ==============================
// TELEGRAM BOT
// ==============================

require("./src/services/telegramService");
// ==============================
// HEALTH CHECK
// ==============================

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "disaster-platform-api" });
});

// ==============================
// 404
// ==============================

app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});

// ==============================
// ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Ошибка сервера" });
});

// ==============================
// START
// ==============================

const server = app.listen(PORT, () => {
  console.log("===================================");
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📌 PID: ${process.pid}`);
  console.log("===================================");
});

// ==============================
// GRACEFUL SHUTDOWN
// ==============================

const shutdown = () => {
  console.log("\n🛑 Завершение работы сервера...");
  server.close(() => {
    console.log("✅ Сервер корректно остановлен");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("❌ Принудительное завершение");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);