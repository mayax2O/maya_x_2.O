import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Locations API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let cityId: string;

  const authAdminEmail = `locations.e2e.auth.${Date.now()}@example.com`;
  const cityName = `E2E Location City ${Date.now()}`;

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
  });

  afterAll(async () => {
    await prisma.location.deleteMany({ where: { cityId } });
    await prisma.city.deleteMany({ where: { id: cityId } });
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("rejects creating a location under a nonexistent city", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Nowhere",
        cityId: "00000000-0000-0000-0000-000000000000",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CITY_NOT_FOUND");
  });

  it("supports the full create → list (filtered by city) → update → delete lifecycle", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Park Street", cityId });
    expect(create.status).toBe(201);
    expect(create.body.data.city.id).toBe(cityId);
    const { id } = create.body.data;

    const list = await request(app.getHttpServer())
      .get("/api/v1/locations")
      .query({ cityId })
      .set("Authorization", `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(
      list.body.data.some((location: { id: string }) => location.id === id),
    ).toBe(true);

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/locations/${id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isActive: false });
    expect(update.status).toBe(200);
    expect(update.body.data.isActive).toBe(false);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/locations/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(remove.status).toBe(204);
  });
});
