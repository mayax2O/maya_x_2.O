export interface TalentCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  displayOrder?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput> & {
  isActive?: boolean;
};
