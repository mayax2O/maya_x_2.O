import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import type { EnvConfig } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig, true>);

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

  // Permissive dev-only CORS so apps/web and apps/admin (different ports)
  // can call the API locally. Tightened to an explicit allow-list once
  // real origins are known — tracked as an M1+ follow-up, not an M0 gap.
  app.enableCors({ origin: true, credentials: true });

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}

void bootstrap();
