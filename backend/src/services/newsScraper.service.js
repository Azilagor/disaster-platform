const axios = require("axios");
const cheerio = require("cheerio");
const prisma = require("../prismaClient");
const logger = require("../utils/logger");


// News Scraper Service
// Парсит tengrinews.kz/tag/чс — первую страницу, раз в день


const SOURCE_URL = "https://tengrinews.kz/tag/%D1%87%D1%81/";
const BASE_URL   = "https://tengrinews.kz";
const SOURCE_NAME = "tengrinews";

// Заголовки имитирующие браузер — уменьшает вероятность блокировки
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Referer": "https://google.com",
};

/**
 * Парсит список новостей с первой страницы тега ЧС.
 * @returns {Promise<Array<{title, url, imageUrl, description, publishedAt}>>}
 */
async function scrapeNews() {
  logger.info("News scraper: starting fetch", { url: SOURCE_URL });

  const res = await axios.get(SOURCE_URL, {
    headers: HEADERS,
    timeout: 15000,
    // Не бросать ошибку на 4xx/5xx — обработаем сами
    validateStatus: () => true,
  });

  if (res.status !== 200) {
    throw new Error(`HTTP ${res.status} from ${SOURCE_URL}`);
  }

  const $ = cheerio.load(res.data);
  const items = [];

  // tengrinews.kz использует несколько возможных структур —
  // пробуем каждый из известных селекторов
  const CARD_SELECTORS = [
    ".content-main-list .list-item",
    ".news-list .news-item",
    "article.news-card",
    ".tag-news .news-item",
    ".tn-news-list li",
    // Общий fallback — любой элемент с ссылкой на /kazakhstan_news/ или /incidents/
    'a[href*="/kazakhstan_news/"], a[href*="/incidents/"]',
  ];

  let found = false;

  for (const selector of CARD_SELECTORS) {
    const nodes = $(selector);
    if (nodes.length === 0) continue;

    found = true;
    logger.info(`News scraper: found ${nodes.length} items with selector "${selector}"`);

    nodes.each((_i, el) => {
      const item = parseNewsCard($, el);
      if (item) items.push(item);
    });

    break;
  }

  // Если ни один селектор не сработал — пробуем универсальный подход
  if (!found) {
    logger.warn("News scraper: no known selector matched, trying generic link extraction");

    $("a").each((_i, el) => {
      const href = $(el).attr("href") || "";
      if (
        !href.includes("/kazakhstan_news/") &&
        !href.includes("/incidents/") &&
        !href.includes("/crime/")
      ) return;

      const fullUrl = href.startsWith("http") ? href : BASE_URL + href;
      const title = $(el).text().trim();

      if (title.length < 10) return; // Слишком короткий текст — не заголовок

      const img = $(el).find("img").first();
      const imageUrl = img.attr("src") || img.attr("data-src") || null;

      items.push({
        title,
        url: fullUrl,
        imageUrl: imageUrl ? resolveUrl(imageUrl) : null,
        description: null,
        publishedAt: null,
      });
    });
  }

  logger.info(`News scraper: parsed ${items.length} items total`);
  return items.slice(0, 20); // Берём не больше 20 с первой страницы
}

/**
 * Парсит одну карточку новости.
 */
function parseNewsCard($, el) {
  const node = $(el);

  // Ссылка
  const linkEl = node.is("a") ? node : node.find("a[href]").first();
  const href = linkEl.attr("href") || "";
  if (!href) return null;
  const url = href.startsWith("http") ? href : BASE_URL + href;

  // Только статьи сайта
  if (!url.includes("tengrinews.kz")) return null;

  // Заголовок
  const title =
    node.find("h2, h3, .title, .news-title, .list-item-title").first().text().trim() ||
    node.find("a").first().text().trim();

  if (!title || title.length < 5) return null;

  // Картинка
  const imgEl = node.find("img").first();
  const rawImg =
    imgEl.attr("src") ||
    imgEl.attr("data-src") ||
    imgEl.attr("data-lazy-src") ||
    node.find("[data-src]").first().attr("data-src") ||
    null;
  const imageUrl = rawImg ? resolveUrl(rawImg) : null;

  // Описание
  const description =
    node.find(".description, .announce, .lead, p").first().text().trim() || null;

  // Дата
  const dateText =
    node.find("time, .date, .news-date, .list-item-date").first().attr("datetime") ||
    node.find("time, .date, .news-date").first().text().trim() ||
    null;

  const publishedAt = dateText ? parseDate(dateText) : null;

  return {
    title: title.slice(0, 500),
    url,
    imageUrl,
    description: description ? description.slice(0, 1000) : null,
    publishedAt,
  };
}

/**
 * Сохраняет новые элементы в БД — пропускает уже существующие (upsert по url).
 * @returns {number} количество новых записей
 */
async function saveNews(items) {
  let newCount = 0;

  for (const item of items) {
    try {
      const result = await prisma.newsItem.upsert({
        where: { url: item.url },
        update: {}, // Не перезаписываем существующие
        create: {
          title:       item.title,
          url:         item.url,
          imageUrl:    item.imageUrl,
          description: item.description,
          publishedAt: item.publishedAt,
          source:      SOURCE_NAME,
        },
      });
      // Prisma upsert не говорит был ли это create или update,
      // поэтому считаем через createdAt
      if (result.createdAt > new Date(Date.now() - 5000)) {
        newCount++;
      }
    } catch (err) {
      logger.warn("News scraper: failed to save item", {
        url: item.url,
        message: err.message,
      });
    }
  }

  return newCount;
}

/**
 * Полный цикл: скрапинг + сохранение.
 */
async function runScraper() {
  try {
    const items = await scrapeNews();
    if (items.length === 0) {
      logger.warn("News scraper: no items found — site may have blocked or changed structure");
      return 0;
    }
    const newCount = await saveNews(items);
    logger.info(`News scraper: done. New items: ${newCount}/${items.length}`);
    return newCount;
  } catch (err) {
    logger.error("News scraper: failed", { message: err.message });
    return 0;
  }
}

// ── Вспомогательные функции ───────────────────────────────────

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return BASE_URL + url;
  return url;
}

function parseDate(str) {
  if (!str) return null;
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

module.exports = { runScraper, scrapeNews, saveNews };