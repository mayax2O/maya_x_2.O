import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Exercises the Admins CRUD API against a real PostgreSQL instance (same
 * DATABASE_URL as the health e2e test — local Postgres in dev, the CI
 * service container in CI), through the actual HTTP layer (global prefix +
 * ValidationPipe), not just the service in isolation.
 */
describe("Admins API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `admin.e2e.${Date.now()}@example.com`;

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
  });

  afterAll(async () => {
    await prisma.admin.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it("supports the full create → list → get → update → delete lifecycle", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/admins")
      .send({
        email: testEmail,
        fullName: "E2E Admin",
        password: "Password1",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      email: testEmail,
      fullName: "E2E Admin",
      isActive: true,
    });
    expect(createResponse.body.data).not.toHaveProperty("passwordHash");
    const { id } = createResponse.body.data;

    const listResponse = await request(app.getHttpServer()).get(
      "/api/v1/admins",
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta).toMatchObject({ page: 1, perPage: 20 });
    expect(
      listResponse.body.data.some((admin: { id: string }) => admin.id === id),
    ).toBe(true);

    const getResponse = await request(app.getHttpServer()).get(
      `/api/v1/admins/${id}`,
    );
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.email).toBe(testEmail);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/admins/${id}`)
      .send({ fullName: "E2E Admin Updated" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.fullName).toBe("E2E Admin Updated");

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/v1/admins/${id}`,
    );
    expect(deleteResponse.status).toBe(204);

    const getAfterDeleteResponse = await request(app.getHttpServer()).get(
      `/api/v1/admins/${id}`,
    );
    expect(getAfterDeleteResponse.status).toBe(404);
    expect(getAfterDeleteResponse.body.error.code).toBe("ADMIN_NOT_FOUND");
  });

  it("rejects a duplicate email with 409 Conflict", async () => {
    const email = `admin.e2e.dup.${Date.now()}@example.com`;

    const first = await request(app.getHttpServer())
      .post("/api/v1/admins")
      .send({
        email,
        fullName: "First Admin",
        password: "Password1",
      });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post("/api/v1/admins")
      .send({ email, fullName: "Second Admin", password: "Password1" });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("ADMIN_EMAIL_CONFLICT");

    await prisma.admin.deleteMany({ where: { email } });
  });

  it("rejects an invalid payload with 400 Bad Request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/admins")
      .send({ email: "not-an-email", fullName: "", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });
});
