import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Talent API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let cityId: string;
  let categoryId: string;

  const authAdminEmail = `talent.e2e.auth.${Date.now()}@example.com`;
  const cityName = `E2E Talent City ${Date.now()}`;
  const categorySlug = `e2e-talent-category-${Date.now()}`;
  const talentSlug = `e2e-talent-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["/", "health", "health/db"] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
    await prisma.admin.create({
      data: {
        email: authAdminEmail,
        fullName: "E2E Auth Admin",
        passwordHash: await hashPassword("AuthAdminPass1"),
      },
    });
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: authAdminEmail, password: "AuthAdminPass1" });
    accessToken = login.body.data.accessToken;

    const city = await prisma.city.create({
      data: { name: cityName, state: "Test State" },
    });
    cityId = city.id;
    const category = await prisma.talentCategory.create({
      data: { name: "E2E Category", slug: categorySlug },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.talent.deleteMany({ where: { slug: talentSlug } });
    await prisma.talentCategory.deleteMany({ where: { id: categoryId } });
    await prisma.city.deleteMany({ where: { id: cityId } });
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/talent");
    expect(response.status).toBe(401);
  });

  it("creates a talent with categories, then filters/searches for it", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/talent")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        displayName: "E2E Talent",
        slug: talentSlug,
        cityId,
        basePrice: 25000,
        categoryIds: [categoryId],
      });

    expect(create.status).toBe(201);
    expect(create.body.data.categories).toEqual([
      expect.objectContaining({ id: categoryId, slug: categorySlug }),
    ]);
    expect(create.body.data.pricing.basePrice).toBe(25000);
    const talentId = create.body.data.id;

    const filtered = await request(app.getHttpServer())
      .get("/api/v1/talent")
      .query({ categorySlug, q: "E2E Talent" })
      .set("Authorization", `Bearer ${accessToken}`);
    expect(filtered.status).toBe(200);
    expect(
      filtered.body.data.some(
        (talent: { id: string }) => talent.id === talentId,
      ),
    ).toBe(true);

    // --- Gallery ---
    const addFirst = await request(app.getHttpServer())
      .post(`/api/v1/talent/${talentId}/media`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ url: "https://example.com/a.jpg", alt: "Photo A" });
    expect(addFirst.status).toBe(201);
    expect(addFirst.body.data.isPrimary).toBe(true);
    const mediaAId = addFirst.body.data.id;

    const addSecond = await request(app.getHttpServer())
      .post(`/api/v1/talent/${talentId}/media`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ url: "https://example.com/b.jpg", alt: "Photo B" });
    expect(addSecond.status).toBe(201);
    expect(addSecond.body.data.isPrimary).toBe(false);
    const mediaBId = addSecond.body.data.id;

    const reorder = await request(app.getHttpServer())
      .patch(`/api/v1/talent/${talentId}/media/reorder`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ mediaIds: [mediaBId, mediaAId] });
    expect(reorder.status).toBe(200);
    expect(reorder.body.data.map((item: { id: string }) => item.id)).toEqual([
      mediaBId,
      mediaAId,
    ]);

    const setPrimary = await request(app.getHttpServer())
      .patch(`/api/v1/talent/${talentId}/media/${mediaBId}/primary`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(setPrimary.status).toBe(200);
    expect(setPrimary.body.data.isPrimary).toBe(true);

    const removePrimary = await request(app.getHttpServer())
      .delete(`/api/v1/talent/${talentId}/media/${mediaBId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(removePrimary.status).toBe(204);

    const afterRemoval = await request(app.getHttpServer())
      .get(`/api/v1/talent/${talentId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterRemoval.body.data.media).toHaveLength(1);
    expect(afterRemoval.body.data.media[0].isPrimary).toBe(true);

    // --- Bulk action (soft delete) ---
    const bulk = await request(app.getHttpServer())
      .post("/api/v1/talent/bulk")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ids: [talentId], action: "delete" });
    expect(bulk.status).toBe(200);
    expect(bulk.body.data).toEqual({ requested: 1, affected: 1 });

    const afterBulkDelete = await request(app.getHttpServer())
      .get(`/api/v1/talent/${talentId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterBulkDelete.status).toBe(404);

    const stillInDb = await prisma.talent.findUnique({
      where: { id: talentId },
    });
    expect(stillInDb?.deletedAt).not.toBeNull();
  });

  it("rejects an invalid payload with 400 Bad Request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/talent")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ displayName: "", cityId: "not-a-uuid", basePrice: -5 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
