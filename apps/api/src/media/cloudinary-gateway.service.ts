import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

import type { EnvConfig } from "../config/env.validation";
import type {
  CloudinaryGateway,
  UploadAssetParams,
  UploadedAsset,
} from "./cloudinary-gateway.interface";

@Injectable()
export class CloudinaryGatewayService implements CloudinaryGateway {
  private readonly uploadFolder: string;

  constructor(configService: ConfigService<EnvConfig, true>) {
    cloudinary.config({
      cloud_name: configService.get("CLOUDINARY_CLOUD_NAME", { infer: true }),
      api_key: configService.get("CLOUDINARY_API_KEY", { infer: true }),
      api_secret: configService.get("CLOUDINARY_API_SECRET", { infer: true }),
      secure: true,
    });
    this.uploadFolder = configService.get("CLOUDINARY_UPLOAD_FOLDER", {
      infer: true,
    });
  }

  uploadAsset(params: UploadAssetParams): Promise<UploadedAsset> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: params.folder
            ? `${this.uploadFolder}/${params.folder}`
            : this.uploadFolder,
          public_id: params.publicId,
          resource_type: "image",
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new Error("Cloudinary upload failed."),
            );
            return;
          }
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        },
      );
      uploadStream.end(params.buffer);
    });
  }

  async deleteAsset(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  }

  buildOptimizedUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: "auto",
      quality: "auto",
    });
  }
}
