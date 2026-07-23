import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import type { EnvConfig } from "./config/env.validation";
import { validateEnv } from "./config/env.validation";
import { AdminsModule } from "./admins/admins.module";
import { AuthModule } from "./auth/auth.module";
import { BookingModule } from "./booking/booking.module";
import { CitiesModule } from "./cities/cities.module";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { HeroModule } from "./hero/hero.module";
import { LocationsModule } from "./locations/locations.module";
import { MediaModule } from "./media/media.module";
import { MembershipModule } from "./membership/membership.module";
import { PaymentsModule } from "./payments/payments.module";
import { TalentModule } from "./talent/talent.module";
import { TalentCategoriesModule } from "./talent-categories/talent-categories.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        throttlers: [
          {
            ttl: config.get("RATE_LIMIT_TTL_SECONDS", { infer: true }) * 1000,
            limit: config.get("RATE_LIMIT_LIMIT", { infer: true }),
          },
        ],
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    AdminsModule,
    UsersModule,
    CitiesModule,
    LocationsModule,
    TalentCategoriesModule,
    TalentModule,
    MediaModule,
    BookingModule,
    MembershipModule,
    PaymentsModule,
    DashboardModule,
    HeroModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Applied globally; AuthController's login/register override with a
    // stricter @Throttle(...) limit on top of this default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
