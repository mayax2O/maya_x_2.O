// Run via `pnpm db:seed` (invokes `prisma db seed`, configured in
// package.json's "prisma.seed" to use ./tsconfig.seed.json — a
// self-contained config, not the shared @maya-x/config chain, because
// ts-node's tsconfig resolution doesn't follow the pnpm workspace symlink
// for @maya-x/config's multi-level `extends`, unlike tsc/nest-cli.
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/auth/password.util";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const superAdminPasswordHash = await hashPassword("SuperAdmin@2026");

  const superAdmin = await prisma.admin.upsert({
    where: { email: "priya.sharma@mayax.com" },
    update: {},
    create: {
      email: "priya.sharma@mayax.com",
      fullName: "Priya Sharma",
      passwordHash: superAdminPasswordHash,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Full agency back-office access." },
  });

  await prisma.adminUserRole.upsert({
    where: {
      adminUserId_roleId: { adminUserId: superAdmin.id, roleId: adminRole.id },
    },
    update: {},
    create: { adminUserId: superAdmin.id, roleId: adminRole.id },
  });

  const testUsers = [
    {
      email: "arjun.mehta@example.com",
      fullName: "Arjun Mehta",
      phone: "+919812345601",
    },
    {
      email: "kavya.nair@example.com",
      fullName: "Kavya Nair",
      phone: "+919812345602",
    },
    {
      email: "rohan.verma@example.com",
      fullName: "Rohan Verma",
      phone: "+919812345603",
    },
  ];

  const users = await Promise.all(
    testUsers.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      }),
    ),
  );

  // Only the first test user gets login credentials — enough for manual
  // QA of /auth/login without giving every seeded customer a password.
  const [firstTestUser] = users;
  if (firstTestUser) {
    const testUserPasswordHash = await hashPassword("TestUser@2026");
    await prisma.userCredential.upsert({
      where: { userId: firstTestUser.id },
      update: {},
      create: {
        userId: firstTestUser.id,
        passwordHash: testUserPasswordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded 1 super admin (${superAdmin.email}) and ${users.length} test users.`,
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
