import { Module } from "@nestjs/common";

import { CLOUDINARY_GATEWAY } from "./cloudinary-gateway.interface";
import { CloudinaryGatewayService } from "./cloudinary-gateway.service";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    { provide: CLOUDINARY_GATEWAY, useClass: CloudinaryGatewayService },
  ],
  exports: [MediaService],
})
export class MediaModule {}
