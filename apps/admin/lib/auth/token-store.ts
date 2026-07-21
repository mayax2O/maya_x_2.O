/**
 * In-memory holder for the current access token, mirrored from
 * AuthContext's React state. Lets plain data-fetch functions (lib/data/*)
 * attach `Authorization: Bearer ...` without every call site threading the
 * token through props/hooks.
 */
let currentAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}
