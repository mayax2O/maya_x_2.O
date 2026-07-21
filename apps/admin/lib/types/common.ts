export type BulkAction = "activate" | "deactivate" | "delete";

export interface BulkActionResult {
  requested: number;
  affected: number;
}

export interface ListQueryParams {
  page?: number;
  perPage?: number;
  q?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
