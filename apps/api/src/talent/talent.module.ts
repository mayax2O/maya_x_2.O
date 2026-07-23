import { Module } from "@nestjs/common";

import { MediaModule } from "../media/media.module";
import { PublicTalentCatalogController } from "./public-talent-catalog.controller";
import { PublicTalentController } from "./public-talent.controller";
import { TalentController } from "./talent.controller";
import { TalentService } from "./talent.service";

@Module({
  imports: [MediaModule],
  controllers: [
    TalentController,
    PublicTalentController,
    PublicTalentCatalogController,
  ],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
