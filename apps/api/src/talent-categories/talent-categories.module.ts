import { Module } from "@nestjs/common";

import { TalentCategoriesController } from "./talent-categories.controller";
import { TalentCategoriesService } from "./talent-categories.service";

@Module({
  controllers: [TalentCategoriesController],
  providers: [TalentCategoriesService],
  exports: [TalentCategoriesService],
})
export class TalentCategoriesModule {}
