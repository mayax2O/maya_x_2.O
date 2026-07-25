import type {
  City,
  Location,
  MediaAsset,
  Talent,
  TalentCategory,
  TalentCategoryMap,
  TalentMedia,
  TalentSubCategory,
  TalentSubCategoryMap,
} from "@prisma/client";

export type TalentWithRelations = Talent & {
  city: City;
  location: Location | null;
  categories: (TalentCategoryMap & { category: TalentCategory })[];
  subCategories: (TalentSubCategoryMap & { subCategory: TalentSubCategory })[];
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
  weightKg: number | null;
  bodyType: string | null;
  preferredCityIds: string[];
  availableOutside: boolean;
  nationality: string | null;
  measurements: string | null;
  chest: string | null;
  waist: string | null;
  hip: string | null;
  dressSize: string | null;
  hairColour: string | null;
  hairLength: string | null;
  eyeColour: string | null;
  generalAvailability: string | null;
  mobile: string | null;
  mobile2: string | null;
  whatsapp: string | null;
  telegram: string | null;
  otherContact: string | null;
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
  subCategories: {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
  }[];
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
    weightKg: talent.weightKg,
    bodyType: talent.bodyType,
    preferredCityIds: talent.preferredCityIds,
    availableOutside: talent.availableOutside,
    nationality: talent.nationality,
    measurements: talent.measurements,
    chest: talent.chest,
    waist: talent.waist,
    hip: talent.hip,
    dressSize: talent.dressSize,
    hairColour: talent.hairColour,
    hairLength: talent.hairLength,
    eyeColour: talent.eyeColour,
    generalAvailability: talent.generalAvailability,
    mobile: talent.mobile,
    mobile2: talent.mobile2,
    whatsapp: talent.whatsapp,
    telegram: talent.telegram,
    otherContact: talent.otherContact,
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
    subCategories: talent.subCategories.map((map) => ({
      id: map.subCategory.id,
      categoryId: map.subCategory.categoryId,
      name: map.subCategory.name,
      slug: map.subCategory.slug,
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

// --- Public-facing shape (GET /public/talent-catalog, /public/talent-
// catalog/:slug) — strips the Connections fields nobody outside the
// agency should see raw (mobile2/telegram/otherContact; `mobile` and
// `whatsapp` stay, since the public profile needs them to build tel:/
// wa.me links), and resolves `preferredCityIds` (bare UUIDs, meaningless
// to a browser) into real city names for the "Working Areas" display.

export type PublicTalentCatalogResponse = Omit<
  TalentResponse,
  "mobile2" | "telegram" | "otherContact" | "preferredCityIds"
> & {
  preferredAreas: { id: string; name: string }[];
};

export function toPublicTalentCatalogResponse(
  talent: TalentWithRelations,
  buildOptimizedUrl: (asset: {
    publicId: string | null;
    url: string;
  }) => string,
  cityNameById: Map<string, string>,
): PublicTalentCatalogResponse {
  const {
    mobile2: _mobile2,
    telegram: _telegram,
    otherContact: _otherContact,
    preferredCityIds,
    ...rest
  } = toTalentResponse(talent, buildOptimizedUrl);

  return {
    ...rest,
    preferredAreas: preferredCityIds
      .map((id) => ({ id, name: cityNameById.get(id) }))
      .filter((area): area is { id: string; name: string } =>
        Boolean(area.name),
      ),
  };
}
