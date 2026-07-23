# MAYA_X_2.0

Premium Talent Platform monorepo — pnpm workspaces, NestJS API, two Next.js
frontends (public web + agency admin), shared packages.

| App          | Path        | Framework | Local port |
| ------------ | ----------- | --------- | ---------- |
| `apps/api`   | REST API    | NestJS    | 4000       |
| `apps/web`   | Public site | Next.js   | 3000       |
| `apps/admin` | Admin panel | Next.js   | 3001       |

## Live deployment

MAYA_X 2.0 is deployed to production:

| Component      | Platform | Status                                              |
| -------------- | -------- | --------------------------------------------------- |
| Public website | Vercel   | Production — `https://hokolgal.fun` (custom domain) |
| Admin panel    | Vercel   | Production                                          |
| Backend API    | Railway  | Production (Docker build)                           |
| Database       | Supabase | PostgreSQL, pooled + direct connections             |

SSL/HTTPS is enabled on all live endpoints. See
[`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the current live status of
every subsystem (auth, booking, membership, payments, media library,
testing, security) and [`CHANGELOG.md`](./CHANGELOG.md) for version
history.

## Local development

Local dev is cloud-only: there is no Docker, no local PostgreSQL, and no
local Supabase instance. `apps/api` connects directly to a cloud Supabase
Postgres database over the internet, the same way it does in production.

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) `>=20` (see `.nvmrc` for the exact version
  CI uses: `20.18.1`)
- [pnpm](https://pnpm.io/) `>=9` — enable via Corepack: `corepack enable`
- A Supabase project (see [Supabase configuration](#supabase-configuration)
  below) — required for `apps/api` to start

Nothing else. No Docker Desktop, no local database engine, no Redis.

### Installation

```bash
git clone https://github.com/mayax2O/maya_x_2.O.git
cd maya_x_2.O
pnpm install
```

### Environment variables

Copy the example env file and fill in your Supabase connection strings:

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/web` and `apps/admin` have no required runtime env vars yet (see their
`.env.example` files) — copy them too if you want the placeholders on disk:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

`apps/api/.env` needs:

| Variable       | Required | Description                                                                    |
| -------------- | -------- | ------------------------------------------------------------------------------ |
| `NODE_ENV`     | No       | Defaults to `development`                                                      |
| `PORT`         | No       | Defaults to `4000`                                                             |
| `DATABASE_URL` | Yes      | Supabase **pooled** connection string (port `6543`, `pgbouncer=true`)          |
| `DIRECT_URL`   | Yes      | Supabase **direct** connection string (port `5432`), used by Prisma migrations |

### Run everything

```bash
pnpm dev
```

This starts `apps/api`, `apps/web`, and `apps/admin` together (in parallel,
with prefixed log output). A fresh clone only ever needs the two commands
above — `pnpm install` then `pnpm dev`.

To run a single app instead: `pnpm dev:api`, `pnpm dev:web`, or
`pnpm dev:admin`.

### Other root scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Start api + web + admin together                  |
| `pnpm build`        | Build every app/package that has a `build` script |
| `pnpm test`         | Run every app/package's test suite                |
| `pnpm lint`         | Lint every app/package                            |
| `pnpm lint:fix`     | Lint with autofix                                 |
| `pnpm typecheck`    | Typecheck every app/package                       |
| `pnpm format`       | Format the repo with Prettier                     |
| `pnpm format:check` | Check formatting without writing                  |

## Supabase configuration

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → Database → copy:
   - **Connection pooling** string (port `6543`) → append
     `?pgbouncer=true&connection_limit=1` → this is `DATABASE_URL`.
   - **Connection string** (direct, port `5432`) → this is `DIRECT_URL`.
3. Put both in `apps/api/.env`.
4. Apply the Prisma schema to your Supabase database:

   ```bash
   pnpm --filter @maya-x/api db:migrate:deploy
   ```

   (Use `db:migrate:dev` instead only if you're actively authoring new
   migrations against a scratch/dev Supabase project.)

Full production deployment details (Railway env vars, Vercel env vars,
GitHub Actions secrets) live in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Railway deployment (`apps/api`)

`apps/api` deploys to Railway as a Docker build (`railway.json` at the repo
root points at `apps/api/Dockerfile`). Summary:

1. Create a Railway project, add a service connected to this repo. Leave
   **Root Directory** as `/` — do not change it.
2. Set service variables: `DATABASE_URL`, `DIRECT_URL`, `NODE_ENV=production`
   (leave `PORT` unset — Railway injects it).
3. Railway auto-deploys on push once connected, or trigger manually via the
   "Deploy API" GitHub Actions workflow (needs a `RAILWAY_TOKEN` repo secret).

Full step-by-step instructions: [`DEPLOYMENT.md`](./DEPLOYMENT.md#2-railway-appsapi).

## Vercel deployment (`apps/web`, `apps/admin`)

Each app is its own Vercel project:

1. Create a Vercel project from this repo for each app, with **Root
   Directory** set to `apps/web` / `apps/admin` respectively, and "Include
   files outside the root directory" enabled (needed for the pnpm workspace
   packages).
2. Vercel's native Git integration deploys previews on PRs and production on
   pushes — no GitHub Actions or secrets required for this path.
3. An Actions-triggered alternative ("Deploy Web" / "Deploy Admin") also
   exists if you prefer triggering from the GitHub UI — needs `VERCEL_TOKEN`,
   `VERCEL_ORG_ID`, and the per-app `VERCEL_PROJECT_ID_*` secrets.

Full step-by-step instructions: [`DEPLOYMENT.md`](./DEPLOYMENT.md#3-vercel-appsweb-and-appsadmin--two-separate-projects).

## Git workflow

- Conventional commits are enforced by commitlint (`.husky/commit-msg`) —
  e.g. `feat(api): add health check`, `fix(web): correct nav link`.
  `pnpm prepare` (runs automatically after `pnpm install`) wires up the
  Husky git hooks.
- `.husky/pre-commit` runs `lint-staged` (ESLint + Prettier) on staged files.
- `main` is the sole integration branch — every milestone branches from
  `main` and merges back into it via pull request.
- Open a pull request per milestone; CI (`.github/workflows/ci.yml`) runs
  format check, lint, typecheck, unit tests, e2e tests, and build against
  every PR and against pushes to `main`.
- CI's Postgres is a disposable GitHub Actions service container used only
  to run `apps/api`'s tests and migrations in the CI job — it has no
  relationship to local development, which always talks to your Supabase
  project directly.
- After every completed milestone, [`PROJECT_STATUS.md`](./PROJECT_STATUS.md),
  [`CHANGELOG.md`](./CHANGELOG.md), and this README are updated together so
  they stay in sync.

## Known issues

- `apps/api` will crash on startup if it cannot reach the database at
  `DATABASE_URL` (pre-existing behavior from M1A, unrelated to this
  milestone) — make sure your Supabase project is reachable and the
  connection strings are correct before running `pnpm dev`.
- `apps/web` and `apps/admin` have no required env vars yet and will start
  regardless of `apps/api`'s state.
