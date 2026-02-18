const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));


const authRoutes = require("./src/routes/auth.routes"); 
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "disaster-platform-api" });
});


app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});


app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Ошибка сервера" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/`);
  console.log(`🔐 Auth: http://localhost:${PORT}/auth`);
  console.log("===================================");
});
