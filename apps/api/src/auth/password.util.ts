import * as argon2 from "argon2";

/**
 * OWASP-recommended argon2id parameters (Password Storage Cheat Sheet,
 * "m=19456 (19 MiB), t=2, p=1" baseline). Centralized here so every
 * password hash in the app (Admin, User) uses identical, deliberately
 * chosen cost parameters rather than argon2's untuned defaults.
 */
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plainTextPassword: string): Promise<string> {
  return argon2.hash(plainTextPassword, ARGON2_OPTIONS);
}

export function verifyPassword(
  hash: string,
  plainTextPassword: string,
): Promise<boolean> {
  return argon2.verify(hash, plainTextPassword);
}
