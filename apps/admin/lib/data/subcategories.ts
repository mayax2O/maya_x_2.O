import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BulkAction,
  BulkActionResult,
  CreateSubCategoryInput,
  ListQueryParams,
  TalentSubCategory,
  UpdateSubCategoryInput,
} from "../types";

export function listSubCategories(
  params: ListQueryParams & { isActive?: boolean; categoryId?: string } = {},
): Promise<Paginated<TalentSubCategory>> {
  return authedFetchList<TalentSubCategory>(
    `/talent-subcategories${buildQuery(params)}`,
  );
}

export function getSubCategory(id: string): Promise<TalentSubCategory> {
  return authedFetch<TalentSubCategory>(`/talent-subcategories/${id}`);
}

export function createSubCategory(
  input: CreateSubCategoryInput,
): Promise<TalentSubCategory> {
  return authedFetch<TalentSubCategory>("/talent-subcategories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSubCategory(
  id: string,
  input: UpdateSubCategoryInput,
): Promise<TalentSubCategory> {
  return authedFetch<TalentSubCategory>(`/talent-subcategories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSubCategory(id: string): Promise<void> {
  return authedFetch<void>(`/talent-subcategories/${id}`, {
    method: "DELETE",
  });
}

export function bulkSubCategories(
  ids: string[],
  action: BulkAction,
): Promise<BulkActionResult> {
  return authedFetch<BulkActionResult>("/talent-subcategories/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
