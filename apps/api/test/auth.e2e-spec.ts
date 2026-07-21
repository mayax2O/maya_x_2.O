import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Exercises the full auth lifecycle against a real PostgreSQL instance,
 * through the actual HTTP layer — register, login, protected-route access,
 * refresh-token rotation, and logout/revocation, for both principal types
 * (User and Admin, the latter created directly via Prisma since there's no
 * admin self-registration endpoint).
 */
describe("Auth API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `auth.e2e.${Date.now()}@example.com`;
  const testPassword = "Password1";
  const adminEmail = `auth.e2e.admin.${Date.now()}@example.com`;
  const adminPassword = "AdminPassword1";

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
    app.use(cookieParser());
    await app.init();

    prisma = moduleRef.get(PrismaService);

    await prisma.admin.create({
      data: {
        email: adminEmail,
        fullName: "E2E Admin",
        passwordHash: await hashPassword(adminPassword),
      },
    });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ user: { email: testEmail } }, { admin: { email: adminEmail } }],
      },
    });
    await prisma.userCredential.deleteMany({
      where: { user: { email: testEmail } },
    });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.admin.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it("registers a new user, returning an access token and setting a refresh cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmail, fullName: "E2E User", password: testPassword });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      email: testEmail,
      fullName: "E2E User",
      type: "user",
      roles: ["user"],
    });
    expect(typeof response.body.data.accessToken).toBe("string");
    expect(response.headers["set-cookie"]?.[0]).toMatch(/^refresh_token=/);
  });

  it("rejects registering the same email twice with 409 Conflict", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        fullName: "Duplicate",
        password: testPassword,
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("USER_EMAIL_CONFLICT");
  });

  it("rejects an invalid register payload with 400 Bad Request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", fullName: "", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials and rejects incorrect ones", async () => {
    const wrongPassword = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: "WrongPassword1" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");

    const correct = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    expect(correct.status).toBe(200);
    expect(correct.body.data.user.email).toBe(testEmail);
  });

  it("logs in as an Admin (falls back from User lookup) with role names", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: adminPassword });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email: adminEmail,
      type: "admin",
    });
    expect(response.body.data.user.roles).toContain("admin");
  });

  it("protects GET /auth/me behind a valid access token", async () => {
    const unauthenticated = await request(app.getHttpServer()).get(
      "/api/v1/auth/me",
    );
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body.error.code).toBe("UNAUTHENTICATED");

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    const { accessToken } = login.body.data;

    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(testEmail);
  });

  it("rotates the refresh token on /auth/refresh and revokes it on /auth/logout", async () => {
    const agent = request.agent(app.getHttpServer());

    const login = await agent
      .post("/api/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    expect(login.status).toBe(200);

    const refreshed = await agent.post("/api/v1/auth/refresh").send();
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.accessToken).toBe("string");
    expect(refreshed.headers["set-cookie"]?.[0]).toMatch(/^refresh_token=/);

    const logout = await agent.post("/api/v1/auth/logout").send();
    expect(logout.status).toBe(204);

    // The (now-revoked) rotated refresh cookie the agent is still holding
    // must no longer work.
    const refreshAfterLogout = await agent.post("/api/v1/auth/refresh").send();
    expect(refreshAfterLogout.status).toBe(401);
    expect(refreshAfterLogout.body.error.code).toBe("REFRESH_TOKEN_INVALID");
  });

  it("rejects /auth/refresh with no refresh token cookie at all", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send();
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("REFRESH_TOKEN_MISSING");
  });
});
