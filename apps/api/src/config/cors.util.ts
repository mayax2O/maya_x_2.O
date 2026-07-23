/**
 * Structurally matches `@nestjs/common`'s `CustomOrigin` type (not imported
 * directly — it's declared on a deep internal path,
 * `@nestjs/common/interfaces/external/cors-options.interface`, not
 * re-exported from the package root, so importing it there would be
 * fragile across Nest versions). `app.enableCors({ origin: ... })` accepts
 * this structurally.
 */
type CorsOriginResult = boolean | string | RegExp | (string | RegExp)[];
type CorsOriginCallback = (
  error: Error | null,
  origin?: CorsOriginResult,
) => void;
type CustomOrigin = (
  requestOrigin: string | undefined,
  callback: CorsOriginCallback,
) => void;

/**
 * Splits a comma-separated env var into a clean list of origins.
 *
 * Defensively strips a single layer of matching wrapping quotes (`"a,b"` or
 * `'a,b'`) from the *whole* value — some dashboards (Railway's raw editor
 * observed in production) store a pasted `KEY="value"` literally, quotes
 * included, which would otherwise silently corrupt the first/last origin
 * in the list (a leading/trailing `"` making it fail exact-match) without
 * any startup error. Per-origin whitespace is trimmed regardless.
 */
export function parseOriginList(raw: string): string[] {
  const unwrapped =
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'")))
      ? raw.slice(1, -1)
      : raw;

  return unwrapped
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Vercel preview URLs carry a per-deployment hash or branch slug
 * (`https://<project>-<hash>-<team>.vercel.app`,
 * `https://<project>-git-<branch>-<team>.vercel.app`) that can't be
 * enumerated in an env var ahead of time. Matching is scoped to this
 * project's known Vercel project slugs (never a bare `*.vercel.app`
 * wildcard) — anyone else's unrelated Vercel deployment must not be able
 * to make credentialed requests against this API just by living on the
 * same platform.
 */
function buildVercelPreviewPattern(projectSlug: string): RegExp {
  const escaped = projectSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^https:\\/\\/${escaped}-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.vercel\\.app$`,
  );
}

export function isVercelPreviewOrigin(
  origin: string,
  previewProjectSlugs: string[],
): boolean {
  return previewProjectSlugs.some((slug) =>
    buildVercelPreviewPattern(slug).test(origin),
  );
}

/**
 * Builds the `cors` package's function-based origin validator: exact
 * allow-list match (production Vercel URLs, localhost dev ports, or
 * whatever else CORS_ORIGIN lists) OR a scoped Vercel preview-deployment
 * pattern match — never a wildcard. Requests with no Origin header
 * (server-to-server, curl, Postman) are allowed through, matching this
 * API's pre-M3 behavior and standard practice: the Origin header is only
 * ever sent by browsers, so there is nothing to check against for
 * non-browser callers, and blocking them would break health checks and
 * webhook-style integrations that were never subject to CORS in the first
 * place — CORS is a browser enforcement mechanism, not an API auth layer.
 */
export function createCorsOriginValidator(
  allowList: string[],
  previewProjectSlugs: string[],
): CustomOrigin {
  return (requestOrigin, callback) => {
    if (!requestOrigin) {
      callback(null, true);
      return;
    }
    const allowed =
      allowList.includes(requestOrigin) ||
      isVercelPreviewOrigin(requestOrigin, previewProjectSlugs);
    callback(null, allowed);
  };
}
