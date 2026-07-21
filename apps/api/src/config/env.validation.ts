import { z } from "zod";

/**
 * Startup env validation for M0. Deliberately minimal: only the variables
 * the bootstrapped app actually reads (NODE_ENV, PORT). DATABASE_URL,
 * REDIS_URL, JWT secrets, Razorpay/Cloudinary keys, etc. are documented in
 * .env.example as placeholders for later milestones, but are NOT validated
 * here yet — adding them to this schema before any code reads them would
 * make local/CI startup fail on variables the app doesn't use.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${result.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  return result.data;
}
