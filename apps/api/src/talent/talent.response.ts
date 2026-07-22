import type {
  City,
  Location,
  MediaAsset,
  Talent,
  TalentCategory,
  TalentCategoryMap,
  TalentMedia,
} from "@prisma/client";

export type TalentWithRelations = Talent & {
  city: City;
  location: Location | null;
  categories: (TalentCategoryMap & { category: TalentCategory })[];
  media: (TalentMedia & { mediaAsset: MediaAsset })[];
};

export interface TalentResponse {
  id: string;
  slug: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  age: number | null;
  city: { id: string; name: string; state: string };
  location: { id: string; name: string } | null;
  languages: string[];
  heightCm: number | null;
  bodyType: string | null;
  pricing: {
    currency: string;
    basePrice: number;
    hourlyRate: number | null;
    overnightRate: number | null;
    weekendRate: number | null;
    customPricingNotes: string | null;
  };
  availability: string;
  verificationStatus: string;
  isPremium: boolean;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  categories: { id: string; name: string; slug: string }[];
  media: {
    id: string;
    mediaAssetId: string;
    url: string;
    optimizedUrl: string;
    alt: string;
    assetType: string;
    isPrimary: boolean;
    displayOrder: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export function toTalentResponse(
  talent: TalentWithRelations,
  buildOptimizedUrl: (asset: {
    publicId: string | null;
    url: string;
  }) => string,
): TalentResponse {
  return {
    id: talent.id,
    slug: talent.slug,
    displayName: talent.displayName,
    tagline: talent.tagline,
    bio: talent.bio,
    age: talent.age,
    city: {
      id: talent.city.id,
      name: talent.city.name,
      state: talent.city.state,
    },
    location: talent.location
      ? { id: talent.location.id, name: talent.location.name }
      : null,
    languages: talent.languages,
    heightCm: talent.heightCm,
    bodyType: talent.bodyType,
    pricing: {
      currency: talent.currency,
      basePrice: Number(talent.basePrice),
      hourlyRate: talent.hourlyRate !== null ? Number(talent.hourlyRate) : null,
      overnightRate:
        talent.overnightRate !== null ? Number(talent.overnightRate) : null,
      weekendRate:
        talent.weekendRate !== null ? Number(talent.weekendRate) : null,
      customPricingNotes: talent.customPricingNotes,
    },
    availability: talent.availability,
    verificationStatus: talent.verificationStatus,
    isPremium: talent.isPremium,
    isFeatured: talent.isFeatured,
    isActive: talent.isActive,
    displayOrder: talent.displayOrder,
    categories: talent.categories.map((map) => ({
      id: map.category.id,
      name: map.category.name,
      slug: map.category.slug,
    })),
    media: talent.media
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => ({
        id: item.id,
        mediaAssetId: item.mediaAssetId,
        url: item.mediaAsset.url,
        optimizedUrl: buildOptimizedUrl(item.mediaAsset),
        alt: item.mediaAsset.altText ?? "",
        assetType: item.mediaAsset.resourceType,
        isPrimary: item.isPrimary,
        displayOrder: item.displayOrder,
      })),
    createdAt: talent.createdAt,
    updatedAt: talent.updatedAt,
  };
}
