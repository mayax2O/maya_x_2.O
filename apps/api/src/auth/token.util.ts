import { createHash } from "crypto";

/**
 * Refresh tokens are signed JWTs (self-describing: sub/type/jti), but only
 * a SHA-256 digest of the raw string is ever persisted (`refresh_tokens.
 * token_hash`) — this lets AuthService revoke/rotate by looking up the
 * digest without the database ever holding a bearer-usable secret.
 */
export function hashRefreshToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

type DurationUnit = "s" | "m" | "h" | "d";

const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;
const UNIT_TO_MS: Record<DurationUnit, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses durations like "15m" or "30d" (the JWT_*_EXPIRES_IN format) into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${value}" — expected a number followed by s/m/h/d, e.g. "15m" or "30d"`,
    );
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit as DurationUnit];
}
