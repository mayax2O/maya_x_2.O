import { refreshRequest } from "../auth/api";
import { getAccessToken, setAccessToken } from "../auth/token-store";
import { apiFetch, apiFetchList, ApiError, type Paginated } from "./client";

function withAuthHeader(options: RequestInit = {}): RequestInit {
  const token = getAccessToken();
  return {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

/**
 * Every admin data call goes through here rather than the raw client:
 * attaches the current access token, and — since access tokens are
 * short-lived — transparently retries once via a silent refresh on a 401
 * before giving up, so a page open across a token expiry doesn't need a
 * manual reload.
 */
export async function authedFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  try {
    return await apiFetch<T>(path, withAuthHeader(options));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const { accessToken } = await refreshRequest();
      setAccessToken(accessToken);
      return apiFetch<T>(path, withAuthHeader(options));
    }
    throw error;
  }
}

export async function authedFetchList<T>(
  path: string,
  options?: RequestInit,
): Promise<Paginated<T>> {
  try {
    return await apiFetchList<T>(path, withAuthHeader(options));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const { accessToken } = await refreshRequest();
      setAccessToken(accessToken);
      return apiFetchList<T>(path, withAuthHeader(options));
    }
    throw error;
  }
}

export { ApiError };
