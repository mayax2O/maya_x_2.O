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
  bodyType: string | null;
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
  bodyType?: string;
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
