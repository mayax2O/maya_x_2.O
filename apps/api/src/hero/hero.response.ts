import type { HeroMode, MediaAsset } from "@prisma/client";

export interface HeroMediaItem {
  id: string;
  url: string;
  resourceType: string;
  altText: string | null;
}

export interface HeroSettingsResponse {
  mode: HeroMode;
  media: HeroMediaItem[];
}

export function toHeroMediaItem(asset: MediaAsset): HeroMediaItem {
  return {
    id: asset.id,
    url: asset.url,
    resourceType: asset.resourceType,
    altText: asset.altText,
  };
}
