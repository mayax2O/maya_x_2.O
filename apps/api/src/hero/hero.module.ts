import { Module } from "@nestjs/common";

import { AdminHeroController } from "./hero-admin.controller";
import { PublicHeroController } from "./hero-public.controller";
import { HeroService } from "./hero.service";

@Module({
  controllers: [AdminHeroController, PublicHeroController],
  providers: [HeroService],
})
export class HeroModule {}
