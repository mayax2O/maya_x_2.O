const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown[];
  readonly status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Thin fetch wrapper for apps/api (REST API Specification's `{ data }` /
 * `{ error: { code, message, details } }` envelope, plus `{ data, meta }`
 * for list endpoints). Always sends `credentials: "include"` so the
 * httpOnly refresh_token cookie AuthModule sets is carried automatically.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const isNoContent = response.status === 204;
  const body = isNoContent ? undefined : await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? {
        code: "UNKNOWN_ERROR",
        message: "Something went wrong.",
        details: [],
      },
    );
  }

  return (body?.data ?? undefined) as T;
}

export async function apiFetchList<T>(
  path: string,
  options: RequestInit = {},
): Promise<Paginated<T>> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error ?? {
        code: "UNKNOWN_ERROR",
        message: "Something went wrong.",
        details: [],
      },
    );
  }

  return {
    items: body.data,
    total: body.meta.total,
    page: body.meta.page,
    perPage: body.meta.perPage,
  };
}

/**
 * Builds a query string from a params object, skipping undefined/null/empty
 * values. Accepts any plain object (list filter DTOs are concrete
 * interfaces, not index-signature types) — the generic constraint is just
 * `object` so callers don't need an `as Record<string, unknown>` cast.
 */
export function buildQuery<T extends object>(params: T): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(
    params as Record<string, unknown>,
  )) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
