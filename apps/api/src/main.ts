import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { createCorsOriginValidator, parseOriginList } from "./config/cors.util";
import type { EnvConfig } from "./config/env.validation";

async function bootstrap() {
  // rawBody: true — POST /payments/webhook needs the exact, unparsed
  // request body (as `req.rawBody`) to verify Razorpay's HMAC signature;
  // computing it over the re-serialized JSON object would not match what
  // Razorpay signed. Every other route is unaffected and keeps working
  // through the normal parsed `req.body`.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService<EnvConfig, true>);

  // REST API Specification §1: all versioned routes live under /api/v1/.
  // Root (`/`) and the M0/M1A health endpoints predate this convention and
  // are excluded so their existing (unprefixed) paths keep working.
  app.setGlobalPrefix("api/v1", {
    exclude: ["/", "health", "health/db"],
  });

  // Global validation pipe: no DTOs exist yet at M0, but every future
  // module's DTOs (Booking, Talent, ...) rely on this being configured
  // once, here, rather than per-controller.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Standard security headers (HSTS, X-Content-Type-Options, etc.).
  app.use(helmet());

  // Reads the refresh_token cookie AuthController's refresh/logout
  // endpoints depend on.
  app.use(cookieParser());

  // Env-driven allow-list (M3) — replaces the M0 permissive `origin: true`
  // now that credentialed (cookie-carrying) requests are possible.
  // `credentials: true` is required for the refresh-token cookie to be
  // sent/accepted cross-origin (apps/web on Vercel, apps/api on Railway).
  // A function-based origin (rather than a static array) additionally
  // accepts Vercel *preview* deployment URLs — which have a per-deploy
  // hash/branch segment that can't be enumerated in CORS_ORIGIN ahead of
  // time — scoped to this project's known Vercel project slugs only, never
  // a bare wildcard. See cors.util.ts for the full rationale.
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

  // Ensures OnModuleDestroy (DatabaseService's pool.end()) actually runs on
  // SIGTERM/SIGINT — required for Railway/Render's graceful-shutdown
  // deploys, not just local Ctrl+C.
  app.enableShutdownHooks();

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}

void bootstrap();
