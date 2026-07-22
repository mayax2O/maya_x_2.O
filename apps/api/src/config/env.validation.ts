import { z } from "zod";

/**
 * Startup env validation. Grows one milestone at a time: only variables the
 * app actually reads belong here. As of M3 that's NODE_ENV/PORT (M0),
 * DATABASE_URL/DIRECT_URL (M1A), and the JWT/CORS/rate-limit variables
 * AuthModule and main.ts read (M3). REDIS_URL, Razorpay/Cloudinary/Resend
 * keys, etc. remain documented in .env.example as placeholders for later
 * milestones, but are NOT validated here yet — adding them before any code
 * reads them would make local/CI startup fail on variables nothing uses.
 */
const envSchema = z
  .object({
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

    // --- M3: JWT authentication ---
    // Two distinct secrets so a leaked access-token signing key can't be
    // used to forge refresh tokens (or vice versa).
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

    // --- M3: CORS ---
    // Comma-separated allow-list; defaults to the local Next.js dev ports
    // for apps/web and apps/admin.
    CORS_ORIGIN: z
      .string()
      .default("http://localhost:3000,http://localhost:3001"),

    // --- M3: rate limiting (@nestjs/throttler) ---
    RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(100),

    // --- M5B: Razorpay (Membership & Payment) ---
    // Read by RazorpayGatewayService — a real Razorpay Dashboard key pair
    // (test or live mode) in every environment that actually creates orders;
    // CI/local-without-a-Razorpay-account can use any non-empty placeholder
    // since e2e tests override the gateway provider rather than calling
    // the real API (see payments.e2e-spec.ts).
    RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
    RAZORPAY_WEBHOOK_SECRET: z
      .string()
      .min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  })
  .refine((config) => config.JWT_ACCESS_SECRET !== config.JWT_REFRESH_SECRET, {
    message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
    path: ["JWT_REFRESH_SECRET"],
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
