/**
 * Frontend-local domain types for the Talent Catalog, mock-data-driven for
 * M2. Field names mirror the TALENTS / TALENT_CATEGORIES / MEDIA_ASSETS
 * tables in docs/04-database (camelCased, as the REST API envelope
 * returns JSON) so that swapping lib/data/talents.ts from mock JSON to a
 * real `fetch` call requires no changes to any component that consumes
 * these types. Once the API defines its own Talent types (a later
 * milestone), this file should be replaced by importing from
 * `@maya-x/types` instead of redefining them here.
 */

export interface TalentCategory {
  id: string;
  name: string;
  slug: string;
}

export interface TalentMedia {
  id: string;
  url: string;
  assetType: "image" | "video";
  alt: string;
}

export type TalentAvailability = "available" | "limited" | "unavailable";

export interface Talent {
  id: string;
  slug: string;
  displayName: string;
  tagline: string;
  bio: string;
  city: string;
  categories: TalentCategory[];
  coverImage: TalentMedia;
  gallery: TalentMedia[];
  languages: string[];
  startingPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  availability: TalentAvailability;
  featured: boolean;
}

export interface TalentFilters {
  query?: string;
  categorySlug?: string;
  city?: string;
  availability?: TalentAvailability;
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
}
