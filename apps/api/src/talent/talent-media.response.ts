import type { MediaAsset, TalentMedia } from "@prisma/client";

export type TalentMediaWithAsset = TalentMedia & { mediaAsset: MediaAsset };

export interface TalentMediaResponse {
  id: string;
  mediaAssetId: string;
  url: string;
  alt: string;
  assetType: string;
  isPrimary: boolean;
  displayOrder: number;
}

export function toTalentMediaResponse(
  media: TalentMediaWithAsset,
): TalentMediaResponse {
  return {
    id: media.id,
    mediaAssetId: media.mediaAssetId,
    url: media.mediaAsset.url,
    alt: media.mediaAsset.altText ?? "",
    assetType: media.mediaAsset.resourceType,
    isPrimary: media.isPrimary,
    displayOrder: media.displayOrder,
  };
}
