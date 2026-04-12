const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { getWeather } = require("../services/weather.service");
const { runScraper } = require("../services/newsScraper.service");
const { parsePagination } = require("../utils/validation");
const logger = require("../utils/logger");


// GET /api/news
// Возвращает сохранённые новости из БД

// router.get("/news", async (req, res, next) => {
//   try {
//     const { page, limit, skip } = parsePagination(req.query);

//     const [items, total] = await prisma.$transaction([
//       prisma.newsItem.findMany({
//         orderBy: [
//           { publishedAt: "desc" },
//           { createdAt: "desc" },
//         ],
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           title: true,
//           url: true,
//           imageUrl: true,
//           description: true,
//           publishedAt: true,
//           source: true,
//           createdAt: true,
//         },
//       }),
//       prisma.newsItem.count(),
//     ]);

//     res.json({ items, total, page, limit });
//   } catch (err) {
//     next(err);
//   }
// });


// POST /api/news/refresh  (можно вызвать вручную для теста)

// router.post("/news/refresh", async (req, res, next) => {
//   try {
//     logger.info("Manual news refresh triggered");
//     const newCount = await runScraper();
//     res.json({ message: "Обновление запущено", newItems: newCount });
//   } catch (err) {
//     next(err);
//   }
// });


// GET /api/weather
// Возвращает текущую погоду (кэш 30 мин)

router.get("/weather", async (req, res, next) => {
  try {
    const weather = await getWeather();
    if (!weather) {
      return res.status(503).json({ message: "Погода недоступна" });
    }
    res.json(weather);
  } catch (err) {
    next(err);
  }
});

module.exports = router;