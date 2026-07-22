import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Dashboard API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const authAdminEmail = `dashboard.e2e.auth.${Date.now()}@example.com`;

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
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/dashboard",
    );
    expect(response.status).toBe(401);
  });

  it("returns real counts and clearly-labeled mocked fields", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body.data.totalUsers).toBe("number");
    expect(typeof response.body.data.totalTalent).toBe("number");
    expect(typeof response.body.data.pendingBookings).toBe("number");
    expect(typeof response.body.data.todaysBookings).toBe("number");
    expect(response.body.data.mockedFields).toEqual([
      "premiumMembers",
      "monthlyRevenue",
    ]);
    expect(Array.isArray(response.body.data.recentActivity)).toBe(true);
    expect(Array.isArray(response.body.data.latestRegistrations)).toBe(true);
  });
});
