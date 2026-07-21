import { z } from "zod";

/**
 * Startup env validation. Grows one milestone at a time: only variables the
 * app actually reads belong here. As of M1A that's NODE_ENV/PORT (M0) plus
 * DATABASE_URL/DIRECT_URL (M1A — database connectivity). REDIS_URL, JWT
 * secrets, Razorpay/Cloudinary/Resend keys, etc. remain documented in
 * .env.example as placeholders for later milestones, but are NOT validated
 * here yet — adding them before any code reads them would make local/CI
 * startup fail on variables nothing uses.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  // Pooled (PgBouncer) connection string in production/Supabase; in plain
  // local/Docker Postgres this is identical to DIRECT_URL.
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
  // Direct, non-pooled connection. Only read by the `prisma migrate` CLI
  // (not by the running app), and only strictly required once the database
  // sits behind PgBouncer (e.g. Supabase) — set it to the same value as
  // DATABASE_URL for a plain, non-pooled local/Docker Postgres.
  DIRECT_URL: z.string().url().optional(),
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
