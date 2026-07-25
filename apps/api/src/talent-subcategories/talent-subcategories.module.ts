import { Module } from "@nestjs/common";

import { TalentSubCategoriesController } from "./talent-subcategories.controller";
import { TalentSubCategoriesService } from "./talent-subcategories.service";

@Module({
  controllers: [TalentSubCategoriesController],
  providers: [TalentSubCategoriesService],
  exports: [TalentSubCategoriesService],
})
export class TalentSubCategoriesModule {}
