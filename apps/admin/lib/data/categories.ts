import { authedFetch, authedFetchList } from "../api/authFetch";
import { buildQuery, type Paginated } from "../api/client";
import type {
  BulkAction,
  BulkActionResult,
  CreateCategoryInput,
  ListQueryParams,
  TalentCategory,
  UpdateCategoryInput,
} from "../types";

export function listCategories(
  params: ListQueryParams & { isActive?: boolean } = {},
): Promise<Paginated<TalentCategory>> {
  return authedFetchList<TalentCategory>(
    `/talent-categories${buildQuery(params)}`,
  );
}

export function getCategory(id: string): Promise<TalentCategory> {
  return authedFetch<TalentCategory>(`/talent-categories/${id}`);
}

export function createCategory(
  input: CreateCategoryInput,
): Promise<TalentCategory> {
  return authedFetch<TalentCategory>("/talent-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<TalentCategory> {
  return authedFetch<TalentCategory>(`/talent-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return authedFetch<void>(`/talent-categories/${id}`, { method: "DELETE" });
}

export function bulkCategories(
  ids: string[],
  action: BulkAction,
): Promise<BulkActionResult> {
  return authedFetch<BulkActionResult>("/talent-categories/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
