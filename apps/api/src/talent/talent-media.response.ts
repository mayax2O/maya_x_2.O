import type { TalentMedia } from "@prisma/client";

export interface TalentMediaResponse {
  id: string;
  url: string;
  alt: string;
  assetType: string;
  isPrimary: boolean;
  displayOrder: number;
}

export function toTalentMediaResponse(media: TalentMedia): TalentMediaResponse {
  return {
    id: media.id,
    url: media.url,
    alt: media.alt,
    assetType: media.assetType,
    isPrimary: media.isPrimary,
    displayOrder: media.displayOrder,
  };
}
