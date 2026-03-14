const TelegramBot = require("node-telegram-bot-api");
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn("⚠️  TELEGRAM_BOT_TOKEN не задан — Telegram-уведомления отключены");
}

const bot = BOT_TOKEN
  ? new TelegramBot(BOT_TOKEN, { polling: true })
  : null;

const PRIORITY_LABELS = {
  CRITICAL: "🔴 Критический",
  HIGH: "🟠 Высокий",
  MEDIUM: "🟡 Средний",
  LOW: "🟢 Низкий",
};

const PROBLEM_TYPE_LABELS = {
  MEDICAL: "🏥 Медицинская помощь",
  FOOD: "🍞 Продукты и вода",
  EVACUATION: "🚗 Эвакуация",
  SHELTER: "🏠 Жильё",
  REPAIR: "🔧 Ремонтные работы",
  PSYCHOLOGICAL: "🧠 Психологическая помощь",
};

const DISTRICT_LABELS = {
  ALMALYNSKIY: "Алмалинский",
  AUEZOVSKIY: "Ауэзовский",
  BOSTANDYQ: "Бостандык",
  MEDEU: "Медеу",
  NAURYZBAY: "Наурызбай",
  TURKSIB: "Турксиб",
  ZHETYSU: "Жетысу",
  ALATAU: "Алатау",
};

const SEVERITY_LABELS = {
  CRITICAL: "🔴 Критический",
  HIGH: "🟠 Высокий",
  MEDIUM: "🟡 Средний",
  LOW: "🟢 Низкий",
};

const INCIDENT_STATUS_LABELS = {
  ACTIVE: "🚨 Активный",
  RESOLVING: "🔧 Ликвидируется",
  RESOLVED: "✅ Ликвидирован",
};

const authSessions = new Map();

async function safeSend(chatId, text, options = {}) {
  if (!bot || !chatId) return null;
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: "HTML", ...options });
  } catch (err) {
    console.error(`Telegram sendMessage error [chatId=${chatId}]:`, err.message);
    return null;
  }
}

async function safeEditText(chatId, messageId, text, options = {}) {
  if (!bot || !chatId || !messageId) return;
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      ...options,
    });
  } catch (err) {
    if (!err.message?.includes("message is not modified")) {
      console.error(`Telegram editMessageText error [chatId=${chatId}]:`, err.message);
    }
  }
}

// /start
if (bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = String(msg.chat.id);

    const existing = await prisma.user.findFirst({
      where: { telegramChatId: chatId, role: "VOLUNTEER" },
      select: { id: true, firstName: true },
    });

    if (existing) {
      await safeSend(
        chatId,
        `👋 Привет, <b>${existing.firstName}</b>! Вы уже подключены.\n\n` +
          `Вы будете получать уведомления о новых заявках.\n\n` +
          `Команды:\n/logout — отключить уведомления`
      );
      return;
    }

    authSessions.set(chatId, { step: "email" });

    await safeSend(
      chatId,
      `👋 Добро пожаловать в <b>DisasterHelp</b>!\n\n` +
        `Для получения уведомлений о заявках необходимо войти в аккаунт волонтёра.\n\n` +
        `📧 Введите ваш <b>email</b>:`
    );
  });
}

// /logout
if (bot) {
  bot.onText(/\/logout/, async (msg) => {
    const chatId = String(msg.chat.id);

    const user = await prisma.user.findFirst({
      where: { telegramChatId: chatId },
      select: { id: true, firstName: true },
    });

    if (!user) {
      await safeSend(chatId, "Вы не подключены к боту.");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: null },
    });

    authSessions.delete(chatId);

    await safeSend(
      chatId,
      `👋 <b>${user.firstName}</b>, вы отключены от уведомлений.\n\n` +
        `Чтобы подключиться снова — напишите /start`
    );
  });
}

// message
if (bot) {
  bot.on("message", async (msg) => {
    if (msg.text && msg.text.startsWith("/")) return;

    const chatId = String(msg.chat.id);
    const session = authSessions.get(chatId);

    if (!session) return;

    const text = msg.text?.trim();
    if (!text) return;

    if (session.step === "email") {
      authSessions.set(chatId, { step: "password", email: text.toLowerCase() });
      await safeSend(chatId, `🔑 Введите ваш <b>пароль</b>:`);
      return;
    }

    if (session.step === "password") {
      const email = session.email;
      const password = text;

      authSessions.delete(chatId);

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          passwordHash: true,
          isEmailVerified: true,
          telegramChatId: true,
        },
      });

      if (!user) {
        await safeSend(chatId, `❌ Неверный email или пароль.\n\nПопробуйте снова — /start`);
        return;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        await safeSend(chatId, `❌ Неверный email или пароль.\n\nПопробуйте снова — /start`);
        return;
      }

      if (!user.isEmailVerified) {
        await safeSend(
          chatId,
          `❌ Ваш email не подтверждён.\n\nПодтвердите email на сайте и попробуйте снова — /start`
        );
        return;
      }

      if (user.role !== "VOLUNTEER") {
        await safeSend(
          chatId,
          `❌ Этот бот только для волонтёров.\n\n` +
            `Ваша роль: <b>${user.role}</b>.\n\n` +
            `Если вы хотите стать волонтёром — обратитесь к координатору на сайте.`
        );
        return;
      }

      if (user.telegramChatId && user.telegramChatId !== chatId) {
        await safeSend(
          chatId,
          `⚠️ Этот аккаунт уже привязан к другому Telegram.\n\n` +
            `Если это вы — войдите через тот аккаунт и напишите /logout, затем попробуйте снова.`
        );
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: chatId },
      });

      await safeSend(
        chatId,
        `✅ Вы успешно подключены, <b>${user.firstName}</b>!\n\n` +
          `Теперь вы будете получать уведомления о новых заявках.\n` +
          `Нажимайте <b>«Откликнуться»</b> прямо в сообщении.\n\n` +
          `Команды:\n/logout — отключить уведомления`
      );
    }
  });
}

// callback_query
if (bot) {
  bot.on("callback_query", async (query) => {
    const { data, from, message } = query;

    try {
      const joinMatch = data.match(/^volunteer_join_(\d+)$/);
      const skipMatch = data.match(/^volunteer_skip_(\d+)$/);

      if (joinMatch) {
        await handleVolunteerJoin(Number(joinMatch[1]), from, query, message);
      } else if (skipMatch) {
        await bot.answerCallbackQuery(query.id, {
          text: "Понято. Если передумаете — запишитесь через сайт.",
        });
      }
    } catch (err) {
      console.error("callback_query error:", err);
      await bot.answerCallbackQuery(query.id, {
        text: "Произошла ошибка. Попробуйте позже.",
      });
    }
  });
}

async function handleVolunteerJoin(requestId, telegramUser, query, message) {
  const chatId = String(telegramUser.id);

  const volunteer = await prisma.user.findFirst({
    where: { telegramChatId: chatId, role: "VOLUNTEER" },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!volunteer) {
    await bot.answerCallbackQuery(query.id, {
      text: "❌ Вы не авторизованы. Напишите /start чтобы войти.",
      show_alert: true,
    });
    return;
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, isPublished: true, title: true },
  });

  if (!request || !request.isPublished) {
    await bot.answerCallbackQuery(query.id, {
      text: "❌ Заявка не найдена или снята с публикации.",
      show_alert: true,
    });
    return;
  }

  if (request.status === "DONE" || request.status === "CANCELLED") {
    await bot.answerCallbackQuery(query.id, {
      text: "❌ Заявка уже закрыта.",
      show_alert: true,
    });
    return;
  }

  try {
    await prisma.requestVolunteer.create({
      data: { requestId, volunteerId: volunteer.id },
    });

    if (request.status === "NEW") {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "IN_PROGRESS" },
      });
    }

    await bot.answerCallbackQuery(query.id, {
      text: `✅ Вы записались на заявку "${request.title}"!`,
      show_alert: true,
    });

    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [[
          { text: `✅ ${volunteer.firstName} ${volunteer.lastName} откликнулся`, callback_data: "done" }
        ]],
      },
      { chat_id: message.chat.id, message_id: message.message_id }
    );
  } catch (e) {
    if (e.code === "P2002") {
      await bot.answerCallbackQuery(query.id, {
        text: "ℹ️ Вы уже записаны на эту заявку.",
      });
    } else {
      throw e;
    }
  }
}

async function notifyNewRequest(request) {
  if (!bot) return;

  const volunteers = await prisma.user.findMany({
    where: {
      role: "VOLUNTEER",
      telegramChatId: { not: null },
    },
    select: { telegramChatId: true },
  });

  if (volunteers.length === 0) return;

  const respondedVolunteers = await prisma.requestVolunteer.findMany({
    where: { requestId: request.id },
    select: { volunteer: { select: { telegramChatId: true } } },
  });
  const respondedChatIds = new Set(
    respondedVolunteers.map((rv) => rv.volunteer.telegramChatId).filter(Boolean)
  );

  const text = [
    `🆘 <b>Новая заявка #${request.id}</b>`,
    ``,
    `<b>${request.title}</b>`,
    ``,
    `📋 Тип: ${PROBLEM_TYPE_LABELS[request.problemType] || request.problemType}`,
    `⚡️ Приоритет: ${PRIORITY_LABELS[request.priority] || request.priority}`,
    `📍 Район: ${DISTRICT_LABELS[request.district] || request.district}`,
    `🏠 Адрес: ${request.address}`,
    request.landmark ? `🗺 Ориентир: ${request.landmark}` : null,
    `👥 Нуждающихся: ${request.peopleCount} чел.`,
  ].filter(Boolean).join("\n");

  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Откликнуться", callback_data: `volunteer_join_${request.id}` },
      { text: "❌ Не смогу", callback_data: `volunteer_skip_${request.id}` },
    ]],
  };

  const keyboardAlreadyJoined = {
    inline_keyboard: [[
      { text: "✅ Вы уже записаны", callback_data: "done" },
    ]],
  };

  const results = await Promise.allSettled(
    volunteers.map((v) => {
      const opts = respondedChatIds.has(v.telegramChatId)
        ? { reply_markup: keyboardAlreadyJoined }
        : { reply_markup: keyboard };
      return safeSend(v.telegramChatId, text, opts);
    })
  );

  const toSave = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value?.message_id) {
      toSave.push({
        requestId: request.id,
        chatId: volunteers[i].telegramChatId,
        messageId: result.value.message_id,
      });
    }
  });

  if (toSave.length > 0) {
    const stillExists = await prisma.request.findUnique({
      where: { id: request.id },
      select: { id: true },
    });

    if (stillExists) {
      await prisma.requestTelegramMessage.createMany({ data: toSave }).catch((e) =>
        console.error("Ошибка сохранения messageId:", e)
      );
    }
  }
}

async function notifyRequestUnpublished(request) {
  if (!bot) return;

  const messages = await prisma.requestTelegramMessage.findMany({
    where: { requestId: request.id },
    select: { chatId: true, messageId: true },
  });

  if (messages.length === 0) return;

  const respondedVolunteers = await prisma.requestVolunteer.findMany({
    where: { requestId: request.id },
    select: { volunteer: { select: { telegramChatId: true } } },
  });
  const respondedChatIds = new Set(
    respondedVolunteers
      .map((rv) => rv.volunteer.telegramChatId)
      .filter(Boolean)
  );

  const textDefault = [
    `🚫 <b>Заявка #${request.id} снята с публикации</b>`,
    ``,
    `<b>${request.title}</b>`,
    ``,
    `Координатор временно снял заявку. Следите за обновлениями.`,
  ].join("\n");

  const textResponded = [
    `🚫 <b>Заявка #${request.id} снята с публикации</b>`,
    ``,
    `<b>${request.title}</b>`,
    ``,
    `Координатор временно снял заявку. Вы уже записаны — ваш отклик сохранён.`,
  ].join("\n");

  await Promise.allSettled(
    messages.map((m) => {
      const text = respondedChatIds.has(m.chatId) ? textResponded : textDefault;
      return safeEditText(m.chatId, m.messageId, text);
    })
  );

  await prisma.requestTelegramMessage.deleteMany({
    where: { requestId: request.id },
  }).catch(() => {});
}

async function notifyVolunteerAssigned(request, volunteer) {
  if (!volunteer.telegramChatId) return;

  const text = [
    `✅ <b>Вас назначили на заявку #${request.id}</b>`,
    ``,
    `<b>${request.title}</b>`,
    ``,
    `📋 Тип: ${PROBLEM_TYPE_LABELS[request.problemType] || request.problemType}`,
    `⚡️ Приоритет: ${PRIORITY_LABELS[request.priority] || request.priority}`,
    `📍 Район: ${DISTRICT_LABELS[request.district] || request.district}`,
    `🏠 Адрес: ${request.address}`,
    request.landmark ? `🗺 Ориентир: ${request.landmark}` : null,
    ``,
    `📞 Контакт: ${request.contactName} — ${request.contactPhone}`,
    request.contactTelegram ? `💬 Telegram: ${request.contactTelegram}` : null,
  ].filter(Boolean).join("\n");

  await safeSend(volunteer.telegramChatId, text);
}

async function notifyRequestDone(request) {
  const creator = await prisma.user.findUnique({
    where: { id: request.createdById },
    select: { telegramChatId: true, firstName: true },
  });

  if (!creator?.telegramChatId) return;

  const text = [
    `✅ <b>Ваша заявка #${request.id} выполнена!</b>`,
    ``,
    `<b>${request.title}</b>`,
    ``,
    `Помощь оказана. Если у вас остались вопросы — свяжитесь с координатором.`,
  ].join("\n");

  await safeSend(creator.telegramChatId, text);
}

async function notifyNewIncident(incident) {
  if (!bot) return;

  const volunteers = await prisma.user.findMany({
    where: {
      role: "VOLUNTEER",
      telegramChatId: { not: null },
    },
    select: { telegramChatId: true },
  });

  if (volunteers.length === 0) return;

  const text = [
    `🚨 <b>НОВЫЙ ИНЦИДЕНТ</b>`,
    ``,
    `<b>${incident.title}</b>`,
    ``,
    `⚠️ Уровень: ${SEVERITY_LABELS[incident.severity] || incident.severity}`,
    `📍 Район: ${DISTRICT_LABELS[incident.district] || incident.district}`,
    ``,
    incident.description,
  ].filter(Boolean).join("\n");

  await Promise.allSettled(
    volunteers.map((v) => safeSend(v.telegramChatId, text))
  );
}

async function notifyIncidentStatusChanged(incident, oldStatus) {
  if (!bot) return;

  const volunteers = await prisma.user.findMany({
    where: {
      role: "VOLUNTEER",
      telegramChatId: { not: null },
    },
    select: { telegramChatId: true },
  });

  if (volunteers.length === 0) return;

  const text = [
    `📢 <b>Обновление по инциденту #${incident.id}</b>`,
    ``,
    `<b>${incident.title}</b>`,
    ``,
    `Статус: ${INCIDENT_STATUS_LABELS[oldStatus] || oldStatus} → ${INCIDENT_STATUS_LABELS[incident.status] || incident.status}`,
    `📍 Район: ${DISTRICT_LABELS[incident.district] || incident.district}`,
  ].join("\n");

  await Promise.allSettled(
    volunteers.map((v) => safeSend(v.telegramChatId, text))
  );
}

async function notifyVolunteerAlreadyJoined(requestId, volunteerId) {
  if (!bot) return;

  const volunteer = await prisma.user.findUnique({
    where: { id: volunteerId },
    select: { telegramChatId: true, firstName: true, lastName: true },
  });

  if (!volunteer?.telegramChatId) return;

  const record = await prisma.requestTelegramMessage.findFirst({
    where: { requestId, chatId: volunteer.telegramChatId },
  });

  if (!record) return;

  try {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [[
          { text: `✅ Вы записаны`, callback_data: "done" }
        ]],
      },
      { chat_id: volunteer.telegramChatId, message_id: record.messageId }
    );
  } catch (e) {
  }
}

module.exports = {
  notifyNewRequest,
  notifyVolunteerAssigned,
  notifyRequestDone,
  notifyNewIncident,
  notifyIncidentStatusChanged,
  notifyRequestUnpublished,
  notifyVolunteerAlreadyJoined,
};