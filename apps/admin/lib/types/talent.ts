export type TalentAvailability = "available" | "limited" | "unavailable";
export type TalentVerificationStatus = "pending" | "verified" | "rejected";

export interface TalentMedia {
  id: string;
  mediaAssetId: string;
  url: string;
  optimizedUrl: string;
  alt: string;
  assetType: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Talent {
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
  availability: TalentAvailability;
  verificationStatus: TalentVerificationStatus;
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
  media: TalentMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface TalentFormValues {
  displayName: string;
  slug?: string;
  tagline?: string;
  bio?: string;
  age?: number;
  cityId: string;
  locationId?: string;
  languages?: string[];
  heightCm?: number;
  weightKg?: number;
  bodyType?: string;
  preferredCityIds?: string[];
  availableOutside?: boolean;
  nationality?: string;
  measurements?: string;
  chest?: string;
  waist?: string;
  hip?: string;
  dressSize?: string;
  hairColour?: string;
  hairLength?: string;
  eyeColour?: string;
  generalAvailability?: string;
  mobile?: string;
  mobile2?: string;
  whatsapp?: string;
  telegram?: string;
  otherContact?: string;
  currency?: string;
  basePrice: number;
  hourlyRate?: number;
  overnightRate?: number;
  weekendRate?: number;
  customPricingNotes?: string;
  availability?: TalentAvailability;
  verificationStatus?: TalentVerificationStatus;
  isPremium?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  categoryIds?: string[];
  subCategoryIds?: string[];
}

export interface TalentListFilters {
  q?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  cityId?: string;
  categorySlug?: string;
  availability?: TalentAvailability;
  verificationStatus?: TalentVerificationStatus;
}
