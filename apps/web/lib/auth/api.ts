import { apiFetch } from "../api/client";
import type { AuthUser, LoginValues, RegisterValues } from "./types";

interface AuthResponseBody {
  accessToken: string;
  user: AuthUser;
}

export function registerRequest(
  values: RegisterValues,
): Promise<AuthResponseBody> {
  return apiFetch<AuthResponseBody>("/auth/register", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function loginRequest(values: LoginValues): Promise<AuthResponseBody> {
  return apiFetch<AuthResponseBody>("/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

/** Relies solely on the httpOnly refresh_token cookie — no body needed. */
export function refreshRequest(): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export function logoutRequest(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function meRequest(accessToken: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
