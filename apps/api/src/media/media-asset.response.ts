import type { MediaAsset } from "@prisma/client";

import type { MediaVariantUrls } from "./cloudinary-gateway.interface";

export interface MediaAssetResponse {
  id: string;
  folderId: string | null;
  url: string;
  optimizedUrl: string;
  variants: MediaVariantUrls;
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
  // AI-ready metadata (M6 polish pass) — always null/empty today, no code
  // path populates them yet. See the MediaAsset model comment.
  aiDescription: string | null;
  aiTags: string[];
  dominantColor: string | null;
  detectedObjects: unknown | null;
  detectedFaces: unknown | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toMediaAssetResponse(
  asset: MediaAsset,
  usageCount: number,
  variants: MediaVariantUrls,
): MediaAssetResponse {
  return {
    id: asset.id,
    folderId: asset.folderId,
    url: asset.url,
    optimizedUrl: variants.original,
    variants,
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
    aiDescription: asset.aiDescription,
    aiTags: asset.aiTags,
    dominantColor: asset.dominantColor,
    detectedObjects: asset.detectedObjects,
    detectedFaces: asset.detectedFaces,
    deletedAt: asset.deletedAt ? asset.deletedAt.toISOString() : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}
