const axios = require("axios");
const logger = require("../utils/logger");


// Weather Service
// Использует OpenWeatherMap API (бесплатный тариф)
// Получить ключ: https://openweathermap.org/api → бесплатно
// Добавить в .env: OPENWEATHER_API_KEY=ваш_ключ


const API_KEY  = process.env.OPENWEATHER_API_KEY;
const CITY     = process.env.WEATHER_CITY || "Almaty";
const LANG     = "ru";
const UNITS    = "metric"; // Цельсии

// Простой кэш в памяти — обновляется раз в 30 минут
let cache = { data: null, fetchedAt: null };
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Возвращает погоду в Алматы.
 * Кэшируется на 30 минут чтобы не тратить бесплатные запросы.
 */
async function getWeather() {
  // Отдаём из кэша если он свежий
  if (cache.data && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  if (!API_KEY) {
    logger.warn("Weather: OPENWEATHER_API_KEY не задан — погода недоступна");
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(CITY)}&appid=${API_KEY}&lang=${LANG}&units=${UNITS}`;

    const res = await axios.get(url, { timeout: 8000 });
    const d   = res.data;

    const weather = {
      city:        d.name,
      temp:        Math.round(d.main.temp),
      feelsLike:   Math.round(d.main.feels_like),
      humidity:    d.main.humidity,
      description: d.weather[0]?.description || "",
      icon:        d.weather[0]?.icon
        ? `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`
        : null,
      windSpeed:   Math.round(d.wind?.speed || 0),
      fetchedAt:   new Date().toISOString(),
    };

    cache = { data: weather, fetchedAt: Date.now() };
    return weather;
  } catch (err) {
    logger.warn("Weather: fetch failed", { message: err.message });
    // При ошибке отдаём старый кэш если есть
    return cache.data || null;
  }
}

module.exports = { getWeather };