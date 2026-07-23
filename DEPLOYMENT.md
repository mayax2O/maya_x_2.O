# Deployment Guide

Deployment topology (per the current, confirmed stack — see project handoff notes, not the Enterprise Architecture doc's earlier AWS mention):

| Component    | Target                           |
| ------------ | -------------------------------- |
| `apps/api`   | Railway (Docker build)           |
| `apps/web`   | Vercel                           |
| `apps/admin` | Vercel                           |
| Database     | Supabase PostgreSQL (via Prisma) |

This document covers configuration only. **No Supabase, Railway, or Vercel account access was assumed or used** — every account-side action below is a manual step for you to perform, listed in the order you'll hit them.

---

## What's already configured in this repo

- `railway.json` (repo root) — tells Railway to build `apps/api` from its `Dockerfile` (build context = repo root, required for the pnpm workspace), run `prisma migrate deploy` as a `preDeployCommand` before starting the server via `startCommand` (`pnpm start:prod`), and health-check `/health`. Previously this was a single chained `startCommand` (`prisma migrate deploy && node dist/main.js`); split into Railway's dedicated `preDeployCommand` field after a real deploy showed a stale dashboard-level Start Command override (`pnpm start:prod`, referencing a script that didn't exist yet) winning over the chained command — see step 2 of the Railway section below for the fix and what to check in the dashboard.
- `apps/api/Dockerfile` — fixed to explicitly run `prisma generate` during the build stage. (Without this, the build silently produces a model-less Prisma Client and fails at compile time — the same bug that broke CI on the M1B PR, caught here before it could also break the image build.)
- `apps/api/Dockerfile` — base image changed from `node:20-alpine` to `node:20-bookworm-slim` (Debian), with `openssl`/`ca-certificates` installed explicitly in both the `build` and `runtime` stages. This fixes a real deploy failure: Prisma's query/schema engines are native binaries dynamically linked against OpenSSL, and Alpine's musl libc plus missing/mismatched `libssl` caused the engine process to crash on startup before it could emit JSON — Railway's start command (`prisma migrate deploy && node dist/main.js`) then failed trying to parse that crash output as JSON (`Could not parse schema engine response`). This is a known, still-recurring class of Prisma/Alpine bug (worse on newer Alpine tags that ship OpenSSL 3 instead of 1.1); Debian's glibc + an explicit `openssl` package give the engine a runtime it can resolve deterministically, instead of chasing the right `apk` package per Alpine release. `apps/web` and `apps/admin` don't use Prisma and weren't touched — Vercel is their real deploy path anyway, these Dockerfiles are for local/staging parity only.
- `.dockerignore` (repo root) — keeps local `docker build` context to source only.
- `apps/web/vercel.json`, `apps/admin/vercel.json` — the standard pnpm-monorepo-on-Vercel pattern: install/build commands `cd` up to the repo root so the workspace (`packages/ui`, `packages/types`, `packages/config`) resolves correctly, since each app's Vercel project has its Root Directory set to that app's folder.
- `.github/workflows/deploy-api.yml`, `deploy-web.yml`, `deploy-admin.yml` — manual (`workflow_dispatch`) GitHub Actions that deploy each service on demand, so a deploy can be triggered from the GitHub UI alone (no local CLI, no local secrets) — see "Continuing without local dev" below.

None of this touches your Railway/Vercel/Supabase accounts by itself — these are dormant config files and workflows until the manual steps below are done.

---

## Manual steps (in order)

### 1. Supabase (carried over from the M1A/M1B handoff — still outstanding)

1. Create a Supabase project.
2. From **Project Settings → Database**, copy:
   - the **Connection pooling** string (port `6543`, add `?pgbouncer=true&connection_limit=1`) → this is `DATABASE_URL`.
   - the **Connection string** (direct, port `5432`) → this is `DIRECT_URL`.
3. Keep both handy for steps 2 and 4 below. Full guidance is already in `apps/api/.env.example`.

### 2. Railway (apps/api)

1. Create a Railway project, add one service, and connect it to this GitHub repo (branch: `main`).
2. In the service's Settings:
   - **Root Directory**: leave as `/` (the repo root) — do **not** set it to `apps/api`. `railway.json` already points at `apps/api/Dockerfile` with the correct build context; changing Root Directory would break that context.
   - Confirm it picks up `railway.json` (Railway auto-detects this at the repo root; no extra config needed).
   - **Check Deploy → Start Command / Pre-Deploy Command for a manual override.** Railway dashboard fields, once set by hand (or auto-populated when the service was first created), take priority over `railway.json`'s `deploy.startCommand`/`preDeployCommand` for that service — this caused a real outage here: the dashboard had a leftover Start Command of `pnpm start:prod` (a script that didn't exist in `apps/api/package.json` at the time) fighting with `railway.json`'s command, so `prisma migrate deploy` ran (via a separately-configured Pre-Deploy Command) but the server itself never started and `/health` stayed unreachable. `apps/api/package.json` now defines `start:prod` to match, and `railway.json` explicitly sets both `preDeployCommand` (`prisma migrate deploy`) and `startCommand` (`pnpm start:prod`) — but if the dashboard fields are still populated with something else, **clear them** (empty = defer to `railway.json`) so config-as-code stays the single source of truth and doesn't drift again.
3. Add environment variables on the service (Settings → Variables):
   - `DATABASE_URL` — Supabase pooled connection string (step 1)
   - `DIRECT_URL` — Supabase direct connection string (step 1)
   - `NODE_ENV` = `production`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — **required since M3**, startup fails without them (`env.validation.ts` enforces ≥32 chars and that the two differ). Generate two independent values: `openssl rand -base64 48`.
   - `CORS_ORIGIN` — **required for production**, comma-separated, no spaces, **no surrounding quotes** (some dashboards store a pasted `KEY="value"` literally — quotes included — which silently breaks matching; the app now defensively strips a single wrapping layer of quotes if present, but don't rely on that): the deployed `apps/web` and `apps/admin` **production** Vercel URLs (e.g. `https://maya-x-web.vercel.app,https://maya-x-admin.vercel.app`). The `.env.example` default only covers `localhost:3000`/`:3001` and must not be relied on in production — credentialed cross-origin requests (the refresh-token cookie) will be silently rejected by the browser otherwise. You do **not** need to add Vercel _preview_ deployment URLs here — see `CORS_VERCEL_PREVIEW_PROJECTS` below.
   - `CORS_VERCEL_PREVIEW_PROJECTS` — optional, defaults to `maya-x-2-o-web,maya-x-2-o-admin`. Comma-separated Vercel **project slugs** (the first path segment of the project's Vercel URL). Preview deployments (`https://<slug>-<hash-or-branch>-<team>.vercel.app` — a different URL on every PR/push) matching one of these slugs are allowed through CORS automatically, without editing `CORS_ORIGIN` per deploy. Only override this if your Vercel project slugs differ from the defaults.
   - Do **not** set `PORT` — Railway injects it automatically, and `env.validation.ts`/`main.ts` already read it correctly (`app.listen(port)` against whatever Railway provides). If Railway's automated diagnosis ever suggests "Set PORT to 3000" during a healthcheck failure, that's very likely a red herring from the same misdiagnosis as the Start Command issue above (the tool sees the server never bound to _any_ port, so it guesses a fixed-port fix) — don't hardcode it; fix the actual Start Command/Pre-Deploy Command config instead.
   - Optional (defaults exist, override only if needed): `JWT_ACCESS_EXPIRES_IN` (`15m`), `JWT_REFRESH_EXPIRES_IN` (`30d`), `RATE_LIMIT_TTL_SECONDS` (`60`), `RATE_LIMIT_LIMIT` (`100`).
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — **required since M5B**, startup fails without them. From your Razorpay Dashboard → Settings → API Keys (Test Mode keys are fine until you're ready to take real payments).
   - `RAZORPAY_WEBHOOK_SECRET` — **required since M5B**. Create a webhook in Razorpay Dashboard → Settings → Webhooks pointing at `https://<your-api>.up.railway.app/api/v1/payments/webhook`, subscribed to at least the `payment.captured`/`payment.failed` events; the secret shown there is this value.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — **required since M6**, startup fails without them. From your Cloudinary Dashboard homepage ("Product Environment Credentials") — a free-tier account is enough to start.
   - Optional (M6, defaults exist): `CLOUDINARY_UPLOAD_FOLDER` (`maya-x`), `MEDIA_MAX_UPLOAD_BYTES` (`10485760`), `MEDIA_MAX_DIMENSION_PX` (`8000`).
   - **Ordering note**: `CORS_ORIGIN` needs the Vercel URLs from step 3 below, which in turn need this Railway URL for `NEXT_PUBLIC_API_BASE_URL`. Deploy Railway first with a placeholder/omitted `CORS_ORIGIN`, do step 3, then come back and set the real `CORS_ORIGIN` and redeploy.
4. If you want deploys triggerable from GitHub Actions (`deploy-api.yml`) rather than only Railway's own auto-deploy-on-push:
   - Railway dashboard → **Project Settings → Tokens** → create a **Project Token**.
   - Add it as a GitHub repo secret named `RAILWAY_TOKEN` (Settings → Secrets and variables → Actions).
   - Optional: if you name the Railway service anything other than `api`, add a repo **variable** (not secret) `RAILWAY_SERVICE_NAME` with that name — `deploy-api.yml` defaults to `api`.

### 3. Vercel (apps/web and apps/admin) — two separate projects

For **each** app:

1. Create a new Vercel project from this GitHub repo.
2. **Root Directory**: set to `apps/web` (or `apps/admin` for the second project).
3. Under **Build & Development Settings**, enable **"Include files outside the root directory in the Build Step"** — required so the workspace packages (`packages/ui`, `packages/types`, `packages/config`) are visible to the install/build commands in that app's `vercel.json`.
4. Environment variables (Project Settings → Environment Variables), once the API is deployed:
   - `NEXT_PUBLIC_API_BASE_URL` — the Railway API's public URL (e.g. `https://<your-api>.up.railway.app`). **Required as of M3/M4** — both apps read it at request time: `apps/web`'s login/register/account pages and `apps/admin`'s entire data layer (auth, dashboard, talent, cities, locations, categories) call it directly. Without it, both apps fall back to `http://localhost:4000`, which will fail in production.
5. That's it — Vercel's native Git integration (this step) is the simplest path: it deploys previews on every PR and production on every push to the connected branch, with **no GitHub Actions or secrets required**.

**Only if** you specifically want deploys triggerable from the GitHub Actions tab instead of (or in addition to) that native integration:

6. Vercel dashboard → **Account Settings → Tokens** → create a token → add as repo secret `VERCEL_TOKEN`.
7. Find your **Org ID** and each project's **Project ID** (Project Settings → General, or `vercel project ls` / `.vercel/project.json` after linking locally) → add as repo secrets `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_ADMIN`.

### 4. GitHub Actions secrets — summary

Add whichever of these you need (only required for the Action-triggered paths in step 2.4 / 3.6–3.7 above — skip entirely if you're relying on Railway/Vercel's native Git integrations):

| Secret                                                 | Used by                              | Where to get it                                     |
| ------------------------------------------------------ | ------------------------------------ | --------------------------------------------------- |
| `RAILWAY_TOKEN`                                        | `deploy-api.yml`                     | Railway → Project Settings → Tokens (Project Token) |
| `RAILWAY_SERVICE_NAME` (repo **variable**, not secret) | `deploy-api.yml`                     | Only if your Railway service isn't named `api`      |
| `VERCEL_TOKEN`                                         | `deploy-web.yml`, `deploy-admin.yml` | Vercel → Account Settings → Tokens                  |
| `VERCEL_ORG_ID`                                        | `deploy-web.yml`, `deploy-admin.yml` | Vercel project settings / `.vercel/project.json`    |
| `VERCEL_PROJECT_ID_WEB`                                | `deploy-web.yml`                     | apps/web's Vercel project settings                  |
| `VERCEL_PROJECT_ID_ADMIN`                              | `deploy-admin.yml`                   | apps/admin's Vercel project settings                |

---

## Environment variables reference (app runtime, not GitHub)

### `apps/api` (Railway service variables)

| Variable                       | Required | Notes                                                                                                                                              |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | Yes      | Supabase pooled (PgBouncer) connection string                                                                                                      |
| `DIRECT_URL`                   | Yes      | Supabase direct connection string — used by `prisma migrate deploy` at container start                                                             |
| `NODE_ENV`                     | Yes      | `production`                                                                                                                                       |
| `JWT_ACCESS_SECRET`            | Yes      | ≥32 chars, distinct from `JWT_REFRESH_SECRET` — startup fails validation otherwise (`env.validation.ts`)                                           |
| `JWT_REFRESH_SECRET`           | Yes      | ≥32 chars, distinct from `JWT_ACCESS_SECRET`                                                                                                       |
| `CORS_ORIGIN`                  | Yes      | Comma-separated **production** Vercel URLs for `apps/web` + `apps/admin`. Defaults to localhost ports — wrong in production                        |
| `CORS_VERCEL_PREVIEW_PROJECTS` | No       | Default `maya-x-2-o-web,maya-x-2-o-admin` — allows preview deployment URLs for these Vercel project slugs without editing `CORS_ORIGIN` per deploy |
| `PORT`                         | No       | Injected by Railway automatically; do not set manually                                                                                             |
| `JWT_ACCESS_EXPIRES_IN`        | No       | Default `15m`                                                                                                                                      |
| `JWT_REFRESH_EXPIRES_IN`       | No       | Default `30d`                                                                                                                                      |
| `RATE_LIMIT_TTL_SECONDS`       | No       | Default `60`                                                                                                                                       |
| `RATE_LIMIT_LIMIT`             | No       | Default `100`                                                                                                                                      |
| `RAZORPAY_KEY_ID`              | Yes      | From Razorpay Dashboard → Settings → API Keys. Startup fails validation without it (M5B)                                                           |
| `RAZORPAY_KEY_SECRET`          | Yes      | Same as above                                                                                                                                      |
| `RAZORPAY_WEBHOOK_SECRET`      | Yes      | From Razorpay Dashboard → Settings → Webhooks, once a webhook pointing at `POST /api/v1/payments/webhook` is configured there                      |
| `CLOUDINARY_CLOUD_NAME`        | Yes      | From the Cloudinary Dashboard's "Product Environment Credentials". Startup fails validation without it (M6)                                        |
| `CLOUDINARY_API_KEY`           | Yes      | Same as above                                                                                                                                      |
| `CLOUDINARY_API_SECRET`        | Yes      | Same as above                                                                                                                                      |
| `CLOUDINARY_UPLOAD_FOLDER`     | No       | Default `maya-x` — folder prefix within your Cloudinary account                                                                                    |
| `MEDIA_MAX_UPLOAD_BYTES`       | No       | Default `10485760` (10MB)                                                                                                                          |
| `MEDIA_MAX_DIMENSION_PX`       | No       | Default `8000`                                                                                                                                     |

Everything else in `apps/api/.env.example` (`REDIS_URL`, `RESEND_API_KEY`) is reserved for later milestones — not read or validated by any code yet, so not required for this deployment.

### `apps/web` / `apps/admin` (Vercel project variables)

| Variable                   | Required now | Notes                                                                                                                                                                                                |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | **Yes**      | The Railway API's public URL. Read at request time by `apps/web`'s auth pages (login/register/account) and by all of `apps/admin`'s data layer — both fall back to `http://localhost:4000` if unset. |

---

## Triggering a deploy

- **Vercel (recommended path)**: push to the connected branch, or open a PR for a preview — no action needed on your part beyond the one-time project connection in step 3.
- **Vercel (via GitHub Actions)**: GitHub → Actions tab → "Deploy Web" or "Deploy Admin" → Run workflow. Requires the secrets from step 3.6–3.7.
- **Railway**: if you enabled Railway's own GitHub integration in step 2.1, pushes deploy automatically. Otherwise, GitHub → Actions tab → "Deploy API" → Run workflow. Requires `RAILWAY_TOKEN` from step 2.4.

All three deploy workflows are `workflow_dispatch`-only right now (manual trigger from the Actions tab) so they don't produce failing runs on every push before secrets exist. Once you've completed the steps above and confirmed a manual run succeeds, tell me and I can switch `deploy-api.yml` to auto-trigger after CI passes (`workflow_run`), matching the pattern already used for `ci.yml`.

---

## Continuing without local dev (Claude Code Remote)

Everything above was written, and the underlying logic verified, entirely from this remote session:

- The Prisma-generate Dockerfile fix was verified by reproducing the exact failure locally (clearing the generated client, confirming `nest build` fails the same way it would inside the Docker build stage, then confirming the fix resolves it) — the same technique used to diagnose and fix the M1B CI failure.
- The Alpine → Debian base image fix (see above) is a config/root-cause fix, not something this session's `nest build`-only reproduction technique can execute end-to-end: there's no Docker daemon available in this session, so the actual `docker build` of `apps/api/Dockerfile` was not run here. The change is standard, widely-documented Prisma guidance (Prisma's own Docker deployment docs recommend Debian-based images over Alpine specifically for this reason) rather than a novel or speculative change; still, treat Railway's first build/deploy log after this change as the real verification: confirm the build stage completes `apt-get install` and `prisma generate` without error, and that the deploy's runtime logs show `prisma migrate deploy` applying/no-op'ing cleanly followed by Nest's normal startup log, with `/health` and `/health/db` returning 200 immediately after.
- No Railway/Vercel/Supabase CLI login, project creation, or API calls were attempted — this session has no credentials for them and none were assumed.

---

## M6 polish pass — architecture review

Before merging M6, a final production-readiness pass reviewed nine specific
items against the shipped implementation. Summary of what changed, what was
already covered, and what's explicitly deferred:

**Implemented this pass** (all additive, no breaking changes):

- Soft delete (Trash) for `MediaAsset` — `DELETE /media/:id` now sets
  `deletedAt` instead of removing the row/Cloudinary object; `POST
/media/:id/restore` undoes it; `DELETE /media/:id/permanent` (only
  callable on a Trashed asset) does the real removal. `GET /media?trashed=true`
  lists Trash. A duplicate upload of previously-Trashed bytes restores the
  existing row rather than erroring on `contentHash`'s unique constraint.
- Every Cloudinary delivery URL (`buildOptimizedUrl`/`buildVariantUrls`) now
  carries the `strip_profile` flag, which strips ICC color profile and any
  embedded EXIF/IPTC/XMP metadata (camera model, GPS location, etc.) from
  the delivered file — this is the guaranteed, code-level control; it does
  not depend on Cloudinary's account-level metadata settings.
- Standardized image variants: `MediaAssetResponse.variants` now returns
  `{ thumbnail (200px), medium (800px), large (1600px), original }`, all
  `f_auto,q_auto` + `strip_profile`. `TalentMedia`'s gallery response also
  gained `optimizedUrl` (via the same Cloudinary gateway, now exported from
  `MediaModule` and injected into `TalentModule`) — the admin Talent editor's
  gallery grid renders this instead of the raw stored URL.
- Nullable AI-ready columns on `MediaAsset` (`aiDescription`, `aiTags`,
  `dominantColor`, `detectedObjects`, `detectedFaces`) — every value is
  `null`/`[]` today; no code path populates them. A future AI-tagging
  milestone is a backfill job against existing rows, not a schema migration.
- `GET /media/stats` — total assets/folders, storage bytes, unused-asset
  count, uploads in the last 7 days, Trashed count. `duplicateAssets` is
  always `0` by design (see below), not a placeholder. Surfaced as a stat
  card row + a "View Trash" toggle on the admin Media Library page.

**Already covered, no change needed:**

- _"Ensure all frontend image delivery uses `f_auto,q_auto`"_ — the admin
  Media Library UI already exclusively rendered `optimizedUrl`/`variants`,
  never the raw `url`, since the original M6 pass. The one gap (Talent
  gallery rendering the raw `url`) is fixed above.
- _"Verify MediaService stays generic/reusable"_ — it already has zero
  Talent-specific logic; the only Talent-aware piece is `MediaUsage`'s
  `entityType: "talent_gallery"` convention, which lives entirely in
  `TalentService`. A future Blog/Banner/Avatar/Homepage module reuses
  `MediaService/MediaModule` unchanged: import `MediaModule`, call
  `mediaService.upload(...)`, write its own `MediaUsage` rows with a new
  `entityType` string. No changes were needed here beyond exporting
  `CLOUDINARY_GATEWAY` from `MediaModule` (done above) so a consuming module
  can build delivery URLs for MediaAssets it already has in hand, without
  re-implementing Cloudinary URL construction.
- _"Duplicate detection"_ — `contentHash`'s DB-level unique constraint
  already makes a true byte-for-byte duplicate structurally impossible in
  this table (verified: re-uploading identical bytes returns the existing
  asset, confirmed by both a unit test and an e2e test). `getStats()`'s
  `duplicateAssets: 0` documents this explicitly rather than logging it as
  an untracked metric.

**Migration rollback/deployment safety (item 8):**

- This pass's migration (`20260722110000_media_library_polish`) is purely
  additive — five nullable/empty-default columns plus one index, no drops,
  no data transformation. It is safe to run against a populated production
  table with zero downtime, and a rollback (if ever needed) would just drop
  the same columns — no data loss in either direction since nothing depends
  on them yet.
- The original M6 migration (`20260722100000_add_media_library`) is the
  riskier one: it drops `talent_media.url/alt/asset_type/cloudinary_public_id`
  after backfilling every row into a new `MediaAsset`. Two things make this
  safe to run against production: (1) Postgres migrations run inside a
  transaction by default under `prisma migrate deploy`, so a mid-migration
  failure rolls back atomically — there's no partially-applied state to
  recover from; (2) the backfill is verified lossless — every pre-existing
  `url`/`alt` pair is preserved verbatim on a new `MediaAsset` row (source:
  `"legacy"`) before the old columns are dropped, confirmed against a
  locally seeded database with real M4 talent gallery data. There is
  intentionally no auto-generated "down" migration (Prisma doesn't produce
  one) — a real rollback of this specific migration would need a new
  forward migration reconstructing `talent_media.url/alt` from the linked
  `MediaAsset`, which is straightforward given the data is fully preserved,
  but wasn't written speculatively since no rollback has been requested.
- **Recommendation before applying to production**: take a Supabase
  point-in-time-recovery snapshot immediately before the Railway deploy that
  runs these migrations, per standard practice for any migration that drops
  columns — this costs nothing and is the real safety net, independent of
  how carefully the migration itself was written.

**Scalability notes for future milestones (item 9), no code change:**

- Uploads are a single synchronous Cloudinary API call inside the request
  handler. Fine at current traffic; a future high-volume bulk-import feature
  should move to a queued/background job rather than scaling this endpoint
  directly.
- `bulkDelete`/`bulkMove` load all matching rows into memory in one query.
  Bounded today by the admin UI only ever multi-selecting one page (≤40)
  at a time; if a future "select all matching filter" feature is added,
  these two methods would need batching.
- `MediaUsage`'s polymorphic `(entityType, entityId)` design is exactly the
  extension point a future Blog/Banner/Avatar/Homepage module needs — no
  schema change required to onboard a new entity type, just new rows with a
  new `entityType` string.
- Cloudinary configuration is a single global account (`CLOUDINARY_UPLOAD_FOLDER`
  plus per-asset `folderId` namespacing). Sufficient for a single-brand
  deployment; a future multi-tenant/white-label requirement would need
  per-tenant Cloudinary credentials or folder-prefix isolation, not
  supported today.

---

## Keeping the project deployable

- `pnpm lint` / `typecheck` / `test` / `test:e2e` / `build` all still pass repo-wide after these changes (config/docs only — no application code changed).
- Local Docker Compose (`infra/docker/docker-compose.yml`) and the existing per-app Dockerfiles are unaffected beyond the `apps/api/Dockerfile` fix above, which only adds a step — it doesn't change any existing behavior.
