const prisma = require("../prismaClient");


// Auth Repository
// Только запросы к БД — никакой бизнес-логики


const USER_AUTH_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  passwordHash: true,
  isEmailVerified: true,
  telegramUsername: true,
  telegramChatId: true,
  district: true,
  avatarUrl: true,
  createdAt: true,
};

const USER_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isEmailVerified: true,
  telegramUsername: true,
  telegramChatId: true,
  district: true,
  avatarUrl: true,
  createdAt: true,
};

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: USER_AUTH_SELECT,
  });
}

async function findByPhone(phone) {
  return prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: USER_PUBLIC_SELECT,
  });
}

async function findByIdWithHash(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, passwordHash: true },
  });
}

async function createUser(data) {
  return prisma.user.create({
    data,
    select: { id: true, email: true, isEmailVerified: true },
  });
}

async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: USER_PUBLIC_SELECT,
  });
}

async function deleteUserWithRelations(userId) {
  return prisma.$transaction([
    prisma.requestVolunteer.deleteMany({ where: { volunteerId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

// ── Email verification ────────────────────────────────────────

async function upsertEmailVerificationToken(userId, tokenHash, expiresAt) {
  return prisma.emailVerificationToken.upsert({
    where: { userId },
    update: { tokenHash, expiresAt },
    create: { userId, tokenHash, expiresAt },
  });
}

async function findEmailVerificationToken(tokenHash) {
  return prisma.emailVerificationToken.findFirst({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });
}

async function confirmEmailVerification(userId) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    }),
    prisma.emailVerificationToken.delete({ where: { userId } }),
  ]);
}

async function deleteEmailVerificationToken(userId) {
  return prisma.emailVerificationToken
    .delete({ where: { userId } })
    .catch(() => {});
}

// ── Password reset ────────────────────────────────────────────

async function upsertPasswordResetToken(userId, tokenHash, expiresAt) {
  return prisma.passwordResetToken.upsert({
    where: { userId },
    update: { tokenHash, expiresAt },
    create: { userId, tokenHash, expiresAt },
  });
}

async function findPasswordResetToken(tokenHash) {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });
}

async function resetPassword(userId, passwordHash) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: USER_PUBLIC_SELECT,
    });
    await tx.passwordResetToken.delete({ where: { userId } });
    return user;
  });
}

async function deletePasswordResetToken(userId) {
  return prisma.passwordResetToken
    .delete({ where: { userId } })
    .catch(() => {});
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  findByIdWithHash,
  createUser,
  updateUser,
  deleteUserWithRelations,
  upsertEmailVerificationToken,
  findEmailVerificationToken,
  confirmEmailVerification,
  deleteEmailVerificationToken,
  upsertPasswordResetToken,
  findPasswordResetToken,
  resetPassword,
  deletePasswordResetToken,
};