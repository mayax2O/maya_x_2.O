/** DI token — inject with `@Inject(CLOUDINARY_GATEWAY)`. */
export const CLOUDINARY_GATEWAY = Symbol("CLOUDINARY_GATEWAY");

export interface UploadAssetParams {
  buffer: Buffer;
  folder?: string;
  publicId?: string;
  filenameHint?: string;
}

export interface UploadedAsset {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export interface CloudinaryGateway {
  uploadAsset(params: UploadAssetParams): Promise<UploadedAsset>;
  deleteAsset(publicId: string): Promise<void>;
  buildOptimizedUrl(publicId: string): string;
}
