const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Открой в браузере: http://localhost:${PORT}/`);
  console.log("===================================");
});
