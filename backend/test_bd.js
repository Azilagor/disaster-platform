const prisma = require("./src/prismaClient");
const crypto = require("crypto");

async function main() {
  console.log("🔌 Testing DB connection...\n");

  const email = `test_${Date.now()}@mail.com`;

  // ✅ CREATE USER
  const user = await prisma.user.create({
    data: {
      firstName: "Test",
      lastName: "User",
      phone: `+7700${Math.floor(Math.random() * 1000000)}`, // уникальный
      email,
      passwordHash: "hash",
      role: "USER",
    },
  });

  console.log("✅ Created user:");
  console.log(user);

  // ✅ CREATE EMAIL TOKEN
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const token = await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log("\n✅ Created verification token:");
  console.log(token);

  // ✅ READ WITH RELATION
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      EmailVerificationToken: true,
    },
  });

  console.log("\n📊 User with token:");
  console.dir(dbUser, { depth: null });

  // ✅ UPDATE (симулируем подтверждение email)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
    },
  });

  console.log("\n✅ Email verified!");

  // ✅ DELETE TOKEN
  await prisma.emailVerificationToken.delete({
    where: {
      userId: user.id,
    },
  });

  console.log("✅ Token deleted");

  console.log("\n📊 Fetching users...\n");

  const users = await prisma.user.findMany();

  console.log(`Total users: ${users.length}`);

  // ⚠️ НЕ удаляем user — пусть будет в базе для тестов
}

main()
  .catch((e) => {
    console.error("❌ DB ERROR:");
    console.error(e);
  })
  .finally(async () => {
    console.log("\n🔌 Closing DB connection...");
    await prisma.$disconnect();
  });
