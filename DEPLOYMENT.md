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

- `railway.json` (repo root) — tells Railway to build `apps/api` from its `Dockerfile` (build context = repo root, required for the pnpm workspace), run `prisma migrate deploy` before starting the server, and health-check `/health`.
- `apps/api/Dockerfile` — fixed to explicitly run `prisma generate` during the build stage. (Without this, the build silently produces a model-less Prisma Client and fails at compile time — the same bug that broke CI on the M1B PR, caught here before it could also break the image build.)
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
3. Add environment variables on the service (Settings → Variables):
   - `DATABASE_URL` — Supabase pooled connection string (step 1)
   - `DIRECT_URL` — Supabase direct connection string (step 1)
   - `NODE_ENV` = `production`
   - Do **not** set `PORT` — Railway injects it automatically, and `env.validation.ts` already reads it with a fallback.
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
   - `NEXT_PUBLIC_API_BASE_URL` — the Railway API's public URL (e.g. `https://<your-api>.up.railway.app`). Not yet read by any code (reserved, per `.env.example`), but worth setting now so it's ready when a later milestone wires it in.
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

| Variable       | Required | Notes                                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | Supabase pooled (PgBouncer) connection string                                          |
| `DIRECT_URL`   | Yes      | Supabase direct connection string — used by `prisma migrate deploy` at container start |
| `NODE_ENV`     | Yes      | `production`                                                                           |
| `PORT`         | No       | Injected by Railway automatically; do not set manually                                 |

Everything else in `apps/api/.env.example` (`JWT_*`, `REDIS_URL`, `CLOUDINARY_URL`, `RESEND_API_KEY`, `RAZORPAY_*`) is reserved for later milestones — not read or validated by any code yet, so not required for this deployment.

### `apps/web` / `apps/admin` (Vercel project variables)

| Variable                   | Required now | Notes                                                                                                                              |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | No           | Reserved — no code reads it yet. Set it once the API's Railway URL exists so it's ready for the milestone that wires up API calls. |

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
- A real `docker build` could not be run here: this environment's egress policy blocks pulling the `docker/dockerfile:1` frontend image from Docker Hub. If you want the Docker build itself verified end-to-end (not just the underlying `nest build` logic it depends on), that needs either a session with registry access, or Railway's own build log on the first real deploy.
- No Railway/Vercel/Supabase CLI login, project creation, or API calls were attempted — this session has no credentials for them and none were assumed.

---

## Keeping the project deployable

- `pnpm lint` / `typecheck` / `test` / `test:e2e` / `build` all still pass repo-wide after these changes (config/docs only — no application code changed).
- Local Docker Compose (`infra/docker/docker-compose.yml`) and the existing per-app Dockerfiles are unaffected beyond the `apps/api/Dockerfile` fix above, which only adds a step — it doesn't change any existing behavior.
