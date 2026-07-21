import { apiFetch } from "../api/client";
import type { AuthUser, LoginValues } from "./types";

interface AuthResponseBody {
  accessToken: string;
  user: AuthUser;
}

export function loginRequest(values: LoginValues): Promise<AuthResponseBody> {
  return apiFetch<AuthResponseBody>("/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

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
