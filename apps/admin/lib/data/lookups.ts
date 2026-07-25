import { listCities } from "./cities";
import { listCategories } from "./categories";
import type { City, TalentCategory } from "../types";

// Cities/categories are small, admin-managed taxonomies — one page is
// always enough for dropdown/filter purposes, so these fetch "all of them"
// rather than being paginated pickers. Capped at 100 to match the shared
// PaginationQueryDto's max perPage (requesting more is a 400).
const LOOKUP_PAGE_SIZE = 100;

export async function listAllActiveCities(): Promise<City[]> {
  const { items } = await listCities({
    perPage: LOOKUP_PAGE_SIZE,
    isActive: true,
    sortBy: "name",
  });
  return items;
}

export async function listAllActiveCategories(): Promise<TalentCategory[]> {
  const { items } = await listCategories({
    perPage: LOOKUP_PAGE_SIZE,
    isActive: true,
    sortBy: "name",
  });
  return items;
}
