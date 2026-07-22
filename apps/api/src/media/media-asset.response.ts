import type { MediaAsset } from "@prisma/client";

export interface MediaAssetResponse {
  id: string;
  folderId: string | null;
  url: string;
  optimizedUrl: string;
  format: string | null;
  resourceType: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  altText: string | null;
  displayOrder: number;
  source: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toMediaAssetResponse(
  asset: MediaAsset,
  usageCount: number,
  optimizedUrl: string,
): MediaAssetResponse {
  return {
    id: asset.id,
    folderId: asset.folderId,
    url: asset.url,
    optimizedUrl,
    format: asset.format,
    resourceType: asset.resourceType,
    bytes: asset.bytes,
    width: asset.width,
    height: asset.height,
    originalFilename: asset.originalFilename,
    altText: asset.altText,
    displayOrder: asset.displayOrder,
    source: asset.source,
    usageCount,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}
