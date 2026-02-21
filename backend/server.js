const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const helmet = require("helmet");
app.use(helmet());

app.use(cors());
app.use(express.json());



app.set("trust proxy", true);

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


const authRoutes = require("./src/routes/auth.routes"); 
app.use("/auth", authRoutes);

const requestRoutes = require("./src/routes/requests.routes");
app.use("/requests", requestRoutes);


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


app.listen(PORT, () => {
  console.log("===================================");
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/`);
  console.log(`🔐 Auth: http://localhost:${PORT}/auth`);
  console.log("===================================");
});
