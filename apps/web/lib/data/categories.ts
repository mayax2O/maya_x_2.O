import categoriesJson from "../mock/talent-categories.json";
import type { TalentCategory } from "../types";

const categories = categoriesJson as TalentCategory[];

export async function getTalentCategories(): Promise<TalentCategory[]> {
  return categories;
}
