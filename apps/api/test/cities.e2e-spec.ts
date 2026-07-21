import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password.util";
import { PrismaService } from "../src/database/prisma.service";

describe("Cities API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const authAdminEmail = `cities.e2e.auth.${Date.now()}@example.com`;
  const testCityName = `E2E City ${Date.now()}`;

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
    await prisma.city.deleteMany({ where: { name: testCityName } });
    await prisma.admin.deleteMany({ where: { email: authAdminEmail } });
    await app.close();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/cities");
    expect(response.status).toBe(401);
  });

  it("supports the full create → list → get → update → bulk deactivate → delete lifecycle", async () => {
    const create = await request(app.getHttpServer())
      .post("/api/v1/cities")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: testCityName, state: "Test State" });
    expect(create.status).toBe(201);
    expect(create.body.data).toMatchObject({
      name: testCityName,
      isActive: true,
    });
    const { id } = create.body.data;

    const list = await request(app.getHttpServer())
      .get("/api/v1/cities")
      .query({ q: testCityName })
      .set("Authorization", `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((city: { id: string }) => city.id === id)).toBe(
      true,
    );

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/cities/${id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ state: "Updated State" });
    expect(update.status).toBe(200);
    expect(update.body.data.state).toBe("Updated State");

    const bulk = await request(app.getHttpServer())
      .post("/api/v1/cities/bulk")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ids: [id], action: "deactivate" });
    expect(bulk.status).toBe(200);
    expect(bulk.body.data).toEqual({ requested: 1, affected: 1 });

    const afterDeactivate = await request(app.getHttpServer())
      .get(`/api/v1/cities/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterDeactivate.body.data.isActive).toBe(false);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/cities/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(remove.status).toBe(204);

    const afterDelete = await request(app.getHttpServer())
      .get(`/api/v1/cities/${id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterDelete.status).toBe(404);
  });

  it("rejects deleting a city still referenced by a talent", async () => {
    const city = await prisma.city.create({
      data: { name: `${testCityName} Referenced`, state: "Test State" },
    });
    const talent = await prisma.talent.create({
      data: {
        displayName: "Referenced Talent",
        slug: `referenced-talent-${Date.now()}`,
        cityId: city.id,
        basePrice: "1000",
      },
    });

    const response = await request(app.getHttpServer())
      .delete(`/api/v1/cities/${city.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CITY_IN_USE");

    await prisma.talent.delete({ where: { id: talent.id } });
    await prisma.city.delete({ where: { id: city.id } });
  });
});
