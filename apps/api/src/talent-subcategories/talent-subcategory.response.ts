import type { TalentSubCategory } from "@prisma/client";

export interface TalentSubCategoryResponse {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
}

export function toTalentSubCategoryResponse(
  subCategory: TalentSubCategory,
): TalentSubCategoryResponse {
  return {
    id: subCategory.id,
    categoryId: subCategory.categoryId,
    name: subCategory.name,
    slug: subCategory.slug,
    isActive: subCategory.isActive,
    displayOrder: subCategory.displayOrder,
  };
}
