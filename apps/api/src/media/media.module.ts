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
  // CLOUDINARY_GATEWAY is exported too, not just MediaService — any module
  // that needs to render a MediaAsset it already has (e.g. TalentModule's
  // gallery response) can build optimized/variant delivery URLs without
  // duplicating the Cloudinary URL-building logic. See item 7 in the M6
  // polish pass: this is exactly the reuse seam a future Blog/Banner/
  // Avatar/Homepage module would import MediaModule for.
  exports: [MediaService, CLOUDINARY_GATEWAY],
})
export class MediaModule {}
