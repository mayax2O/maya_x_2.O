import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import type { EnvConfig } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  const corsOrigins = config
    .get("CORS_ORIGIN", { infer: true })
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

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
