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

  // --- M4: Talent Catalog seed data ---

  const categoryDefs = [
    { name: "Event Host", slug: "event-host", displayOrder: 1 },
    { name: "Anchor & MC", slug: "anchor-mc", displayOrder: 2 },
    { name: "Brand Ambassador", slug: "brand-ambassador", displayOrder: 3 },
    { name: "Classical Dance", slug: "classical-dance", displayOrder: 4 },
    { name: "Folk & Live Music", slug: "folk-live-music", displayOrder: 5 },
    { name: "Photography", slug: "photography", displayOrder: 6 },
    { name: "Modeling", slug: "modeling", displayOrder: 7 },
    { name: "Singing", slug: "singing", displayOrder: 8 },
  ];
  const categories = await Promise.all(
    categoryDefs.map((category) =>
      prisma.talentCategory.upsert({
        where: { slug: category.slug },
        update: {},
        create: category,
      }),
    ),
  );
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  const cityDefs = [
    { name: "Kolkata", state: "West Bengal", displayOrder: 1 },
    { name: "Mumbai", state: "Maharashtra", displayOrder: 2 },
    { name: "Delhi", state: "Delhi", displayOrder: 3 },
    { name: "Bengaluru", state: "Karnataka", displayOrder: 4 },
    { name: "Chennai", state: "Tamil Nadu", displayOrder: 5 },
  ];
  const cities = await Promise.all(
    cityDefs.map((city) =>
      prisma.city.upsert({
        where: { name_state: { name: city.name, state: city.state } },
        update: {},
        create: city,
      }),
    ),
  );
  const cityByName = new Map(cities.map((city) => [city.name, city]));
  const kolkata = cityByName.get("Kolkata");

  const locationDefs = kolkata
    ? [
        { name: "Park Street", cityId: kolkata.id, displayOrder: 1 },
        { name: "Salt Lake", cityId: kolkata.id, displayOrder: 2 },
      ]
    : [];
  const locations = await Promise.all(
    locationDefs.map((location) =>
      prisma.location.upsert({
        where: {
          cityId_name: { cityId: location.cityId, name: location.name },
        },
        update: {},
        create: location,
      }),
    ),
  );
  const locationByName = new Map(
    locations.map((location) => [location.name, location]),
  );

  const talentDefs = [
    {
      slug: "ananya-rao",
      displayName: "Ananya Rao",
      tagline: "Event Host & Presenter",
      bio: "Ananya has hosted over 200 corporate and wedding events across eastern India, known for her composed stage presence and bilingual (English/Bengali) hosting.",
      age: 29,
      cityName: "Kolkata",
      locationName: "Park Street",
      languages: ["English", "Bengali", "Hindi"],
      heightCm: 168,
      bodyType: "Slim",
      basePrice: "25000",
      hourlyRate: "5000",
      overnightRate: "60000",
      weekendRate: "90000",
      isPremium: true,
      isFeatured: true,
      verificationStatus: "verified" as const,
      categorySlugs: ["event-host", "anchor-mc"],
    },
    {
      slug: "karan-bhatt",
      displayName: "Karan Bhatt",
      tagline: "Brand Ambassador",
      bio: "Karan represents premium consumer brands at retail launches and experiential activations, with a decade of on-camera and in-person brand work.",
      age: 34,
      cityName: "Mumbai",
      locationName: null,
      languages: ["English", "Hindi"],
      heightCm: 182,
      bodyType: "Athletic",
      basePrice: "40000",
      hourlyRate: "8000",
      overnightRate: null,
      weekendRate: "110000",
      isPremium: true,
      isFeatured: false,
      verificationStatus: "verified" as const,
      categorySlugs: ["brand-ambassador"],
    },
    {
      slug: "rituparna-sen",
      displayName: "Rituparna Sen",
      tagline: "Classical Odissi Dancer",
      bio: "Rituparna trained under the Kolkata Odissi tradition for over 15 years and performs at cultural evenings, weddings, and Durga Puja functions.",
      age: 31,
      cityName: "Kolkata",
      locationName: "Salt Lake",
      languages: ["Bengali", "English"],
      heightCm: 160,
      bodyType: "Slim",
      basePrice: "18000",
      hourlyRate: "4000",
      overnightRate: null,
      weekendRate: "45000",
      isPremium: false,
      isFeatured: true,
      verificationStatus: "verified" as const,
      categorySlugs: ["classical-dance"],
    },
    {
      slug: "abir-chakraborty",
      displayName: "Abir Chakraborty",
      tagline: "Event Photographer",
      bio: "Abir specializes in candid wedding and corporate event photography, with a documentary-style eye developed over 12 years in Kolkata's studio circuit.",
      age: 38,
      cityName: "Kolkata",
      locationName: null,
      languages: ["Bengali", "English"],
      heightCm: null,
      bodyType: null,
      basePrice: "15000",
      hourlyRate: "3000",
      overnightRate: "35000",
      weekendRate: "50000",
      isPremium: false,
      isFeatured: false,
      verificationStatus: "pending" as const,
      categorySlugs: ["photography"],
    },
    {
      slug: "trisha-dutta",
      displayName: "Trisha Dutta",
      tagline: "Fashion & Editorial Model",
      bio: "Trisha has walked for leading Indian designers at Kolkata Fashion Week and shot editorials for regional lifestyle publications.",
      age: 24,
      cityName: "Kolkata",
      locationName: null,
      languages: ["English", "Bengali", "Hindi"],
      heightCm: 174,
      bodyType: "Slim",
      basePrice: "22000",
      hourlyRate: "5000",
      overnightRate: null,
      weekendRate: null,
      isPremium: false,
      isFeatured: false,
      verificationStatus: "pending" as const,
      categorySlugs: ["modeling"],
    },
  ];

  let talentCount = 0;
  for (const talentDef of talentDefs) {
    const city = cityByName.get(talentDef.cityName);
    if (!city) continue;
    const location = talentDef.locationName
      ? locationByName.get(talentDef.locationName)
      : null;

    const talent = await prisma.talent.upsert({
      where: { slug: talentDef.slug },
      update: {},
      create: {
        slug: talentDef.slug,
        displayName: talentDef.displayName,
        tagline: talentDef.tagline,
        bio: talentDef.bio,
        age: talentDef.age,
        cityId: city.id,
        locationId: location?.id,
        languages: talentDef.languages,
        heightCm: talentDef.heightCm,
        bodyType: talentDef.bodyType,
        basePrice: talentDef.basePrice,
        hourlyRate: talentDef.hourlyRate,
        overnightRate: talentDef.overnightRate,
        weekendRate: talentDef.weekendRate,
        isPremium: talentDef.isPremium,
        isFeatured: talentDef.isFeatured,
        verificationStatus: talentDef.verificationStatus,
        createdBy: superAdmin.id,
      },
    });
    talentCount += 1;

    for (const categorySlug of talentDef.categorySlugs) {
      const category = categoryBySlug.get(categorySlug);
      if (!category) continue;
      await prisma.talentCategoryMap.upsert({
        where: {
          talentId_categoryId: { talentId: talent.id, categoryId: category.id },
        },
        update: {},
        create: { talentId: talent.id, categoryId: category.id },
      });
    }

    const existingMedia = await prisma.talentMedia.findFirst({
      where: { talentId: talent.id },
    });
    if (!existingMedia) {
      await prisma.talentMedia.create({
        data: {
          talentId: talent.id,
          url: `/mock/talent/${talentDef.slug}/cover.jpg`,
          alt: `${talentDef.displayName} portrait`,
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded 1 super admin (${superAdmin.email}), ${users.length} test users, ` +
      `${categories.length} categories, ${cities.length} cities, ${locations.length} locations, ` +
      `and ${talentCount} talents.`,
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
