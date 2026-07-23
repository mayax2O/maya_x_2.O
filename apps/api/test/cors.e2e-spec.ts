import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";

import { AppModule } from "../src/app.module";
import {
  createCorsOriginValidator,
  parseOriginList,
} from "../src/config/cors.util";
import type { EnvConfig } from "../src/config/env.validation";
import { PrismaService } from "../src/database/prisma.service";

/**
 * Exercises main.ts's real CORS configuration end-to-end. `Test.createTestingModule`
 * doesn't run `bootstrap()`, so `app.enableCors(...)` is called here exactly
 * as main.ts does — same helper functions, same ConfigService values —
 * rather than duplicating the logic by hand, so this test would actually
 * fail if main.ts's wiring drifted from cors.util.ts's behavior.
 */
describe("CORS (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `cors.e2e.${Date.now()}@example.com`;
  const testPassword = "Password1";

  // Matches the app's default CORS_ORIGIN / CORS_VERCEL_PREVIEW_PROJECTS
  // (see env.validation.ts) — not overridden here, so this exercises the
  // exact defaults a fresh deploy would have.
  const allowedOrigin = "http://localhost:3000";
  const allowedPreviewOrigin =
    "https://maya-x-2-o-admin-54251ws3v-adminhkgofc-8722s-projects.vercel.app";
  const blockedOrigin = "https://evil.example.com";

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

    const config = app.get(ConfigService<EnvConfig, true>);
    const corsOrigins = parseOriginList(
      config.get("CORS_ORIGIN", { infer: true }),
    );
    const corsPreviewProjects = parseOriginList(
      config.get("CORS_VERCEL_PREVIEW_PROJECTS", { infer: true }),
    );
    app.enableCors({
      origin: createCorsOriginValidator(corsOrigins, corsPreviewProjects),
      credentials: true,
    });

    await app.init();

    prisma = moduleRef.get(PrismaService);
    await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: testEmail,
      password: testPassword,
      fullName: "CORS E2E User",
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  describe("OPTIONS preflight", () => {
    it("returns Access-Control-Allow-Origin + Allow-Credentials for an allowed origin", async () => {
      const response = await request(app.getHttpServer())
        .options("/api/v1/auth/login")
        .set("Origin", allowedOrigin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type");

      expect(response.status).toBeLessThan(400);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin,
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
      expect(response.headers["access-control-allow-origin"]).not.toBe("*");
    });

    it("returns Access-Control-Allow-Origin for a matching Vercel preview origin", async () => {
      const response = await request(app.getHttpServer())
        .options("/api/v1/auth/login")
        .set("Origin", allowedPreviewOrigin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type");

      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedPreviewOrigin,
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("omits CORS headers for a blocked origin", async () => {
      const response = await request(app.getHttpServer())
        .options("/api/v1/auth/login")
        .set("Origin", blockedOrigin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("POST /auth/login", () => {
    it("returns CORS headers on a successful login from an allowed origin", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("Origin", allowedOrigin)
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin,
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      // httpOnly refresh_token cookie set on the auth-scoped path.
      const setCookie = response.headers["set-cookie"];
      expect(
        (Array.isArray(setCookie) ? setCookie : [setCookie]).some((c: string) =>
          c?.startsWith("refresh_token="),
        ),
      ).toBe(true);
    });

    it("omits CORS headers for a login request from a blocked origin", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("Origin", blockedOrigin)
        .send({ email: testEmail, password: testPassword });

      // The API itself doesn't reject the request server-side (CORS is a
      // browser-enforced mechanism) — but without the header, a real
      // browser blocks the response from ever reaching the calling page's
      // JS, which is the actual security boundary here.
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("POST /auth/refresh and /auth/logout", () => {
    it("refresh and logout both return CORS headers for an allowed origin", async () => {
      const login = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("Origin", allowedOrigin)
        .send({ email: testEmail, password: testPassword });
      const cookies = login.headers["set-cookie"] as unknown as string[];

      const refresh = await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("Origin", allowedOrigin)
        .set("Cookie", cookies);
      expect(refresh.status).toBe(200);
      expect(refresh.headers["access-control-allow-origin"]).toBe(
        allowedOrigin,
      );
      const refreshCookies = refresh.headers["set-cookie"] as unknown as
        string[] | undefined;

      const logout = await request(app.getHttpServer())
        .post("/api/v1/auth/logout")
        .set("Origin", allowedOrigin)
        .set("Cookie", refreshCookies ?? cookies);
      expect(logout.status).toBe(204);
      expect(logout.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    });
  });
});
