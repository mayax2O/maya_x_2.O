import { Module } from "@nestjs/common";

import { PublicTalentController } from "./public-talent.controller";
import { TalentController } from "./talent.controller";
import { TalentService } from "./talent.service";

@Module({
  controllers: [TalentController, PublicTalentController],
  providers: [TalentService],
  exports: [TalentService],
})
export class TalentModule {}
