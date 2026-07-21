import type { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import type { EnvConfig } from "../config/env.validation";

export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Scoped to /api/v1/auth (not the whole API) so the cookie is never sent on
// unrelated requests. Cross-site by design (apps/web on Vercel, apps/api on
// Railway are different origins), which is why this requires
// SameSite=None + Secure in production — plain Lax/insecure locally, since
// browsers reject Secure cookies over http://localhost.
const COOKIE_PATH = "/api/v1/auth";

function cookieOptions(configService: ConfigService<EnvConfig, true>) {
  const isProduction =
    configService.get("NODE_ENV", { infer: true }) === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: COOKIE_PATH,
  };
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  expiresAt: Date,
  configService: ConfigService<EnvConfig, true>,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...cookieOptions(configService),
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(
  res: Response,
  configService: ConfigService<EnvConfig, true>,
): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions(configService));
}
