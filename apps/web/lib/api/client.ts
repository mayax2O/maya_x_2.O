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

/**
 * Thin fetch wrapper for apps/api (REST API Specification's `{ data }` /
 * `{ error: { code, message, details } }` envelope). Always sends
 * `credentials: "include"` so the httpOnly refresh_token cookie AuthModule
 * sets is carried automatically — this app never touches that cookie
 * directly, only the JSON body (accessToken, user).
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
