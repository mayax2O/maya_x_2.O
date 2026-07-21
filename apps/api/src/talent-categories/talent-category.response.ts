import type { TalentCategory } from "@prisma/client";

export interface TalentCategoryResponse {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
}

export function toTalentCategoryResponse(
  category: TalentCategory,
): TalentCategoryResponse {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
  };
}
