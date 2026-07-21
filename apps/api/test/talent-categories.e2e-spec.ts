import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Talent Categories API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const authAdminEmail = `categories.e2e.auth.${Date.now()}@example.com`;
  const categoryName = `E2E Category ${Date.now()}`;

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
  });

  afterAll(async () => {
    await prisma.talentCategory.deleteMany({ where: { name: categoryName } });
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("auto-derives a slug from the name when none is given", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/talent-categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: categoryName });

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe(
      categoryName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  });

  it("rejects a duplicate slug with 409", async () => {
    const first = await request(app.getHttpServer())
      .post("/api/v1/talent-categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Duplicate Slug Category", slug: "dup-slug-e2e" });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post("/api/v1/talent-categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Another Name", slug: "dup-slug-e2e" });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("CATEGORY_CONFLICT");

    await prisma.talentCategory.deleteMany({ where: { slug: "dup-slug-e2e" } });
  });
});
