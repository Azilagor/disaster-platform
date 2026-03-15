// seed-demo.js
// Создаёт тестовые заявки и инциденты с координатами в Алматы
// Запуск: node seed-demo.js

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Реальные точки Алматы ────────────────────────────────────
const REQUESTS_DATA = [
  {
    problemType: "MEDICAL",
    title: "Требуется медицинская помощь пожилому человеку",
    description: "Пожилой мужчина 78 лет, жалуется на боли в груди. Лифт не работает, живёт на 5 этаже. Родственники не могут добраться быстро. Необходима помощь до приезда скорой.",
    priority: "CRITICAL",
    address: "ул. Байзакова, 280, кв. 52",
    district: "ALMALYNSKIY",
    landmark: "Рядом с магазином Рамстор",
    latitude: 43.2567,
    longitude: 76.9286,
    peopleCount: 1,
    contactName: "Иванова Мария",
    contactPhone: "+77001234501",
  },
  {
    problemType: "EVACUATION",
    title: "Затопление подвала жилого дома",
    description: "После сильных дождей затопило подвал пятиэтажного дома. Вода поднялась на 40 см, начинает просачиваться в квартиры первого этажа. В доме 32 квартиры, около 80 жильцов.",
    priority: "HIGH",
    address: "мкр. Тастак-2, д. 14",
    district: "AUEZOVSKIY",
    landmark: "Напротив школы №156",
    latitude: 43.2398,
    longitude: 76.8876,
    peopleCount: 80,
    contactName: "Ахметов Серик",
    contactPhone: "+77001234502",
  },
  {
    problemType: "FOOD",
    title: "Многодетная семья осталась без продуктов",
    description: "Семья с 4 детьми (от 3 до 12 лет) осталась без средств к существованию после пожара. Нужны продукты питания, детское питание для младшего ребёнка, предметы первой необходимости.",
    priority: "HIGH",
    address: "ул. Саина, 54, кв. 12",
    district: "AUEZOVSKIY",
    landmark: "ТЦ Алтын Орда рядом",
    latitude: 43.2312,
    longitude: 76.8754,
    peopleCount: 6,
    contactName: "Нурланова Айгуль",
    contactPhone: "+77001234503",
  },
  {
    problemType: "EVACUATION",
    title: "Нужна эвакуация семьи из зоны оползня",
    description: "На горном склоне в Медеуском районе начался оползень. Семья из 3 человек находится в доме в опасной зоне. Дорога частично перекрыта, нужен внедорожник или вертолёт.",
    priority: "CRITICAL",
    address: "ул. Горная, 15",
    district: "MEDEU",
    landmark: "Выше катка Медеу, 300м",
    latitude: 43.1567,
    longitude: 76.9312,
    peopleCount: 3,
    contactName: "Петров Александр",
    contactPhone: "+77001234504",
  },
  {
    problemType: "SHELTER",
    title: "Семья осталась без жилья после пожара",
    description: "Ночью сгорела квартира, семья из 5 человек (двое взрослых и трое детей) на улице. Вещи сгорели. Нужно временное жильё и одежда. Дети простужаются.",
    priority: "CRITICAL",
    address: "пр. Абая, 117",
    district: "BOSTANDYQ",
    landmark: "Рядом с ТРЦ Mega Alma-Ata",
    latitude: 43.2198,
    longitude: 76.9087,
    peopleCount: 5,
    contactName: "Смирнова Ольга",
    contactPhone: "+77001234505",
  },
  {
    problemType: "REPAIR",
    title: "Прорыв трубы отопления в жилом доме",
    description: "В подвале дома прорвало трубу центрального отопления. Кипяток заливает подвал, пар идёт через вентиляцию в квартиры. Управляющая компания не отвечает на звонки уже 4 часа.",
    priority: "HIGH",
    address: "мкр. Жетысу-3, д. 22",
    district: "ZHETYSU",
    landmark: "Возле рынка Шапагат",
    latitude: 43.3012,
    longitude: 77.0234,
    peopleCount: 120,
    contactName: "Бекова Зарина",
    contactPhone: "+77001234506",
  },
  {
    problemType: "PSYCHOLOGICAL",
    title: "Психологическая помощь пострадавшим при ДТП",
    description: "На перекрёстке произошло серьёзное ДТП. 6 человек в шоковом состоянии ожидают помощи. Среди них двое детей 7 и 10 лет. Нужен психолог или кризисный консультант.",
    priority: "MEDIUM",
    address: "пересечение пр. Аль-Фараби и ул. Розыбакиева",
    district: "BOSTANDYQ",
    landmark: "Светофор у парка Первого Президента",
    latitude: 43.2089,
    longitude: 76.9456,
    peopleCount: 6,
    contactName: "Джаксыбеков Нурлан",
    contactPhone: "+77001234507",
  },
  {
    problemType: "MEDICAL",
    title: "Массовое отравление в столовой завода",
    description: "После обеда в заводской столовой плохо стало 15 рабочим. Симптомы: рвота, головокружение, боли в животе. Скорая уже едет но нужны дополнительные волонтёры-медики.",
    priority: "HIGH",
    address: "ул. Промышленная, 8",
    district: "TURKSIB",
    landmark: "Завод АлматыЭнерго, проходная №2",
    latitude: 43.3234,
    longitude: 77.0567,
    peopleCount: 15,
    contactName: "Касымов Бауыржан",
    contactPhone: "+77001234508",
  },
  {
    problemType: "EVACUATION",
    title: "Застряли люди в лифте бизнес-центра",
    description: "В лифте бизнес-центра застряли 4 человека, в том числе беременная женщина. Лифт завис между 7 и 8 этажами. Техническая служба не может приехать раньше чем через 2 часа.",
    priority: "MEDIUM",
    address: "пр. Достык, 38",
    district: "MEDEU",
    landmark: "БЦ Нурлы Тау, башня А",
    latitude: 43.2312,
    longitude: 76.9612,
    peopleCount: 4,
    contactName: "Администратор БЦ",
    contactPhone: "+77001234509",
  },
  {
    problemType: "FOOD",
    title: "Помощь нужна одиноким пенсионерам района",
    description: "В связи с введением карантина в доме престарелых около 40 пожилых людей остались без возможности выйти за продуктами. Нужна доставка продуктов питания и лекарств.",
    priority: "MEDIUM",
    address: "ул. Момышулы, 22",
    district: "NAURYZBAY",
    landmark: "Дом ветеранов, синее здание",
    latitude: 43.2876,
    longitude: 76.8234,
    peopleCount: 40,
    contactName: "Директор Садыков А.К.",
    contactPhone: "+77001234510",
  },
];

const INCIDENTS_DATA = [
  {
    title: "Наводнение в Ауэзовском районе",
    description: "После 3 суток проливных дождей река Большая Алматинка вышла из берегов. Подтоплено 12 улиц в Ауэзовском районе. Эвакуировано 340 человек. Ведутся спасательные работы. Развёрнуты 2 временных пункта размещения.",
    severity: "CRITICAL",
    district: "AUEZOVSKIY",
  },
  {
    title: "Пожар в жилом квартале Бостандык",
    description: "Крупный пожар охватил 3 жилых дома по улице Тимирязева. Горит 4 и 5 этажи. 18 семей эвакуированы. Работают 6 пожарных расчётов. Пострадавших нет, 1 человек госпитализирован с отравлением дымом.",
    severity: "HIGH",
    district: "BOSTANDYQ",
  },
  {
    title: "Оползень в районе Медеу",
    description: "На горном склоне выше микрорайона Думан зафиксирован оползень. Под угрозой 4 частных дома. Дорога Алматы-Медеу перекрыта на 2 км. Жители предупреждены через систему оповещения.",
    severity: "HIGH",
    district: "MEDEU",
  },
  {
    title: "Отключение теплоснабжения в Жетысу",
    description: "Авария на теплотрассе оставила без отопления 24 жилых дома в мкр. Жетысу-2 и Жетысу-3. Без тепла около 3200 квартир. Температура в квартирах упала до +12°C. Аварийные бригады работают в круглосуточном режиме.",
    severity: "MEDIUM",
    district: "ZHETYSU",
  },
];

async function seedDemo() {
  console.log("🌱 Запуск демо-сида...\n");

  // ── 1. Найти или создать координатора ────────────────────────
  let coordinator = await prisma.user.findFirst({
    where: { role: "COORDINATOR" },
    select: { id: true, email: true },
  });

  if (!coordinator) {
    console.log("👤 Создаём координатора...");
    const hash = await bcrypt.hash("Demo1234!", 10);
    coordinator = await prisma.user.create({
      data: {
        firstName: "Координатор",
        lastName: "Демо",
        email: "coordinator@demo.kz",
        phone: "+77770000001",
        passwordHash: hash,
        role: "COORDINATOR",
        isEmailVerified: true,
        district: "ALMALYNSKIY",
      },
      select: { id: true, email: true },
    });
    console.log(`   ✅ Создан: ${coordinator.email} / пароль: Demo1234!\n`);
  } else {
    console.log(`   ℹ️  Используем координатора: ${coordinator.email}\n`);
  }

  // ── 2. Найти или создать обычного пользователя ────────────────
  let user = await prisma.user.findFirst({
    where: { role: "USER" },
    select: { id: true, email: true },
  });

  if (!user) {
    console.log("👤 Создаём пользователя...");
    const hash = await bcrypt.hash("Demo1234!", 10);
    user = await prisma.user.create({
      data: {
        firstName: "Пользователь",
        lastName: "Демо",
        email: "user@demo.kz",
        phone: "+77770000002",
        passwordHash: hash,
        role: "USER",
        isEmailVerified: true,
      },
      select: { id: true, email: true },
    });
    console.log(`   ✅ Создан: ${user.email} / пароль: Demo1234!\n`);
  }

  // ── 3. Создать инциденты ──────────────────────────────────────
  console.log("🚨 Создаём инциденты...");
  const incidents = [];

  for (const data of INCIDENTS_DATA) {
    const existing = await prisma.incident.findFirst({
      where: { title: data.title },
      select: { id: true },
    });

    if (existing) {
      console.log(`   ⏭  Инцидент уже существует: "${data.title}"`);
      incidents.push(existing);
      continue;
    }

    const incident = await prisma.incident.create({
      data: { ...data, createdById: coordinator.id },
      select: { id: true, title: true },
    });
    incidents.push(incident);
    console.log(`   ✅ #${incident.id}: ${incident.title}`);
  }

  console.log();

  // ── 4. Создать заявки с координатами ─────────────────────────
  console.log("📋 Создаём заявки с гео-точками...");
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < REQUESTS_DATA.length; i++) {
    const data = REQUESTS_DATA[i];

    const existing = await prisma.request.findFirst({
      where: { title: data.title },
      select: { id: true },
    });

    if (existing) {
      console.log(`   ⏭  Заявка уже существует: "${data.title}"`);
      skipped++;
      continue;
    }

    // Привязываем к инциденту если есть совпадение по типу/приоритету
    let incidentId = null;
    if (data.priority === "CRITICAL" && incidents.length > 0) {
      incidentId = incidents[i % incidents.length]?.id || null;
    }

    const req = await prisma.request.create({
      data: {
        problemType:    data.problemType,
        title:          data.title,
        description:    data.description,
        priority:       data.priority,
        status:         "NEW",
        address:        data.address,
        district:       data.district,
        landmark:       data.landmark,
        latitude:       data.latitude,
        longitude:      data.longitude,
        peopleCount:    data.peopleCount,
        contactName:    data.contactName,
        contactPhone:   data.contactPhone,
        contactEmail:   `demo${i + 1}@example.kz`,
        consentAt:      new Date(),
        createdById:    user.id,
        isPublished:    true,
        publishedAt:    new Date(),
        publishedById:  coordinator.id,
        incidentId,
      },
      select: { id: true, title: true, latitude: true, longitude: true, priority: true },
    });

    console.log(`   ✅ #${req.id} [${req.priority}] ${req.title}`);
    console.log(`      📍 ${req.latitude}, ${req.longitude}`);
    created++;
  }

  // ── 5. Итог ───────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("✅ Демо-сид завершён!");
  console.log(`   Заявок создано:  ${created} (пропущено: ${skipped})`);
  console.log(`   Инцидентов:      ${INCIDENTS_DATA.length}`);
  console.log("\n🗺  Открой карту чтобы увидеть точки: /map");
  console.log("\n🔑 Тестовые аккаунты:");
  console.log(`   Координатор: coordinator@demo.kz / Demo1234!`);
  console.log(`   Пользователь: user@demo.kz / Demo1234!`);
  console.log("=".repeat(50));
}

seedDemo()
  .catch((e) => {
    console.error("❌ Ошибка сида:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });