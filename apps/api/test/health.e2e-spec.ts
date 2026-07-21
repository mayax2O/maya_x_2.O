import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

/**
 * Exercises the real DatabaseService against an actual PostgreSQL instance
 * (DATABASE_URL from the environment — local Postgres in dev, a service
 * container in CI). This is the one place M1A proves the database
 * connection genuinely works end-to-end, not just that the code compiles.
 */
describe("GET /health/db (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with a connected status when the database is reachable", async () => {
    const response = await request(app.getHttpServer()).get("/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      database: "connected",
    });
    expect(typeof response.body.latencyMs).toBe("number");
  });
});
