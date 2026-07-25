import { apiFetch, apiFetchList, ApiError } from "../api/client";
import type { Talent, TalentFilters } from "../types";

/**
 * Real API-backed data layer for the Talent Catalog (GET /public/talent-
 * catalog) — replaces the M2 mock JSON. Function signatures are unchanged
 * so no page/component needed to change, only this file's implementation.
 * `rating`/`reviewCount` have no real backend equivalent yet (never built
 * past the mock-data stage), so they default to 0 — TalentCard and the
 * profile page hide the rating badge when reviewCount is 0.
 */

interface ApiTalentMedia {
  id: string;
  url: string;
  alt: string;
  assetType: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface ApiTalentResponse {
  id: string;
  slug: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  city: { id: string; name: string; state: string };
  languages: string[];
  heightCm: number | null;
  bodyType: string | null;
  nationality: string | null;
  measurements: string | null;
  dressSize: string | null;
  hairColour: string | null;
  eyeColour: string | null;
  generalAvailability: string | null;
  pricing: {
    currency: string;
    basePrice: number;
  };
  availability: Talent["availability"];
  isFeatured: boolean;
  isPremium: boolean;
  verificationStatus: string;
  createdAt: string;
  // Only Mobile + WhatsApp are ever returned publicly (see
  // toPublicTalentCatalogResponse on the API) — never rendered as visible
  // text, only used to build tel:/wa.me link targets.
  mobile: string | null;
  whatsapp: string | null;
  preferredAreas: { id: string; name: string }[];
  categories: { id: string; name: string; slug: string }[];
  media: ApiTalentMedia[];
}

// A talent counts as "new" for this many days after creation — matches
// the common storefront convention (e.g. Amazon/Flipkart "New" tags).
const NEW_WINDOW_DAYS = 30;

function isRecentlyCreated(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function toWebTalent(api: ApiTalentResponse): Talent {
  const gallery = api.media.map((item) => ({
    id: item.id,
    url: item.url,
    assetType: (item.assetType === "video" ? "video" : "image") as
      "image" | "video",
    alt: item.alt,
  }));
  const primaryIndex = api.media.findIndex((item) => item.isPrimary);
  const coverImage = gallery[primaryIndex] ??
    gallery[0] ?? {
      id: "placeholder",
      url: "",
      assetType: "image" as const,
      alt: api.displayName,
    };

  return {
    id: api.id,
    slug: api.slug,
    displayName: api.displayName,
    tagline: api.tagline ?? "",
    bio: api.bio ?? "",
    city: api.city.name,
    categories: api.categories,
    coverImage,
    gallery,
    languages: api.languages,
    startingPrice: api.pricing.basePrice,
    currency: api.pricing.currency,
    rating: 0,
    reviewCount: 0,
    availability: api.availability,
    featured: api.isFeatured,
    premium: api.isPremium,
    verified: api.verificationStatus === "verified",
    isNew: isRecentlyCreated(api.createdAt),
    mobile: api.mobile,
    whatsapp: api.whatsapp,
    workingAreas: api.preferredAreas,
    details: {
      nationality: api.nationality,
      measurements: api.measurements,
      heightCm: api.heightCm,
      bodyType: api.bodyType,
      dressSize: api.dressSize,
      hairColour: api.hairColour,
      eyeColour: api.eyeColour,
      generalAvailability: api.generalAvailability,
    },
  };
}

const SORT_TO_API: Record<
  NonNullable<TalentFilters["sort"]>,
  "featured" | "price-asc" | "price-desc"
> = {
  featured: "featured",
  rating: "featured",
  "price-asc": "price-asc",
  "price-desc": "price-desc",
};

export async function getTalents(
  filters: TalentFilters = {},
): Promise<Talent[]> {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.categorySlug) params.set("categorySlug", filters.categorySlug);
  if (filters.city) params.set("city", filters.city);
  if (filters.availability) params.set("availability", filters.availability);
  params.set("sort", SORT_TO_API[filters.sort ?? "featured"]);
  params.set("perPage", "100");

  const { items } = await apiFetchList<ApiTalentResponse>(
    `/public/talent-catalog?${params.toString()}`,
  );
  return items.map(toWebTalent);
}

export async function getTalentBySlug(
  slug: string,
): Promise<Talent | undefined> {
  try {
    const talent = await apiFetch<ApiTalentResponse>(
      `/public/talent-catalog/${slug}`,
    );
    return toWebTalent(talent);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getFeaturedTalents(limit = 3): Promise<Talent[]> {
  const { items } = await apiFetchList<ApiTalentResponse>(
    "/public/talent-catalog?sort=featured&perPage=50",
  );
  return items
    .filter((item) => item.isFeatured)
    .slice(0, limit)
    .map(toWebTalent);
}

/**
 * Premium talent for the home page's scrolling rail. Unlike Featured
 * (capped at 3 by the API), this is deliberately unlimited — the marquee
 * loops however many there are. `limit` is only a sanity bound so one
 * over-eager admin can't turn the rail into a thousand-card DOM.
 */
export async function getPremiumTalents(limit = 20): Promise<Talent[]> {
  const { items } = await apiFetchList<ApiTalentResponse>(
    "/public/talent-catalog?sort=featured&perPage=100",
  );
  return items
    .filter((item) => item.isPremium)
    .slice(0, limit)
    .map(toWebTalent);
}

export async function getTalentSlugs(): Promise<string[]> {
  try {
    const { items } = await apiFetchList<ApiTalentResponse>(
      "/public/talent-catalog?perPage=200",
    );
    return items.map((item) => item.slug);
  } catch {
    // Build-time generateStaticParams shouldn't fail the build if the API
    // is unreachable — pages just render on-demand instead of prebuilt.
    return [];
  }
}

export async function getRelatedTalents(
  talent: Talent,
  limit = 3,
): Promise<Talent[]> {
  const categorySlug = talent.categories[0]?.slug;
  if (!categorySlug) return [];

  const { items } = await apiFetchList<ApiTalentResponse>(
    `/public/talent-catalog?categorySlug=${encodeURIComponent(categorySlug)}&perPage=10`,
  );
  return items
    .filter((item) => item.id !== talent.id)
    .slice(0, limit)
    .map(toWebTalent);
}

export async function getCities(): Promise<string[]> {
  return apiFetch<string[]>("/public/talent-catalog/cities");
}
