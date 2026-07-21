/**
 * Protocol-level types matching the response envelope defined in the
 * REST API Specification (§1.1). Deliberately contains no domain/business
 * types (Booking, Talent, User, etc.) — those arrive with their owning
 * milestone (M1+), once the corresponding database models exist.
 */

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
}
