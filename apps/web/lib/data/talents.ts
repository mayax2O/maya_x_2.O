import talentsJson from "../mock/talents.json";
import type { Talent, TalentFilters } from "../types";

/**
 * Mock data-access layer for the Talent Catalog. Every function here is
 * `async` and returns the same shape a real API call will — swap the body
 * for a `fetch("/api/v1/talents")` once the backend exists; no caller
 * (page or component) needs to change.
 */

const talents = talentsJson as Talent[];

export async function getTalents(
  filters: TalentFilters = {},
): Promise<Talent[]> {
  let result = [...talents];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    result = result.filter(
      (talent) =>
        talent.displayName.toLowerCase().includes(query) ||
        talent.tagline.toLowerCase().includes(query) ||
        talent.city.toLowerCase().includes(query),
    );
  }

  if (filters.categorySlug) {
    result = result.filter((talent) =>
      talent.categories.some(
        (category) => category.slug === filters.categorySlug,
      ),
    );
  }

  if (filters.city) {
    result = result.filter((talent) => talent.city === filters.city);
  }

  if (filters.availability) {
    result = result.filter(
      (talent) => talent.availability === filters.availability,
    );
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.startingPrice - b.startingPrice);
      break;
    case "price-desc":
      result.sort((a, b) => b.startingPrice - a.startingPrice);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "featured":
    default:
      result.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }

  return result;
}

export async function getTalentBySlug(
  slug: string,
): Promise<Talent | undefined> {
  return talents.find((talent) => talent.slug === slug);
}

export async function getFeaturedTalents(limit = 4): Promise<Talent[]> {
  return talents.filter((talent) => talent.featured).slice(0, limit);
}

export async function getTalentSlugs(): Promise<string[]> {
  return talents.map((talent) => talent.slug);
}

export async function getRelatedTalents(
  talent: Talent,
  limit = 3,
): Promise<Talent[]> {
  const categorySlugs = new Set(
    talent.categories.map((category) => category.slug),
  );
  return talents
    .filter(
      (candidate) =>
        candidate.id !== talent.id &&
        candidate.categories.some((category) =>
          categorySlugs.has(category.slug),
        ),
    )
    .slice(0, limit);
}

export async function getCities(): Promise<string[]> {
  return Array.from(new Set(talents.map((talent) => talent.city))).sort();
}
