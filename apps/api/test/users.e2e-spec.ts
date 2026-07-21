import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Exercises the Users CRUD API against a real PostgreSQL instance, through
 * the actual HTTP layer (global prefix + ValidationPipe) — mirrors the
 * Admins e2e suite.
 *
 * As of M3 every route here requires an authenticated Admin (this is the
 * admin-facing customer management API — public self-registration is
 * POST /auth/register, covered by auth.e2e-spec.ts).
 */
describe("Users API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const testEmail = `user.e2e.${Date.now()}@example.com`;
  const authAdminEmail = `user.e2e.auth-admin.${Date.now()}@example.com`;
  const authAdminPassword = "AuthAdminPass1";

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
        passwordHash: await hashPassword(authAdminPassword),
      },
    });

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: authAdminEmail, password: authAdminPassword });
    accessToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/users");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("supports the full create → list → get → update → delete lifecycle", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: testEmail,
        fullName: "E2E User",
        phone: "+919812340000",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      email: testEmail,
      fullName: "E2E User",
      phone: "+919812340000",
    });
    const { id } = createResponse.body.data;

    const listResponse = await request(app.getHttpServer())
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.data.some((user: { id: string }) => user.id === id),
    ).toBe(true);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/users/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.email).toBe(testEmail);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/users/${id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fullName: "E2E User Updated" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.fullName).toBe("E2E User Updated");

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/v1/users/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteResponse.status).toBe(204);

    const getAfterDeleteResponse = await request(app.getHttpServer())
      .get(`/api/v1/users/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(getAfterDeleteResponse.status).toBe(404);
    expect(getAfterDeleteResponse.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("rejects a duplicate email with 409 Conflict", async () => {
    const email = `user.e2e.dup.${Date.now()}@example.com`;

    const first = await request(app.getHttpServer())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email, fullName: "First User" });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email, fullName: "Second User" });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("USER_EMAIL_CONFLICT");

    await prisma.user.deleteMany({ where: { email } });
  });

  it("rejects an invalid payload with 400 Bad Request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "not-an-email", fullName: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
