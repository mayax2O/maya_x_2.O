import { Module } from "@nestjs/common";

import { MediaModule } from "../media/media.module";
import { PublicTalentController } from "./public-talent.controller";
import { TalentController } from "./talent.controller";
import { TalentService } from "./talent.service";

@Module({
  imports: [MediaModule],
  controllers: [TalentController, PublicTalentController],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
