# Contributing to MAYA_X_2.0

This document is the contract for how changes get made in this repo —
by a human, a future teammate, or an AI agent. Follow it even if you're the
only one working on the project today; consistency now is what keeps the
codebase legible as it grows.

See [README.md](./README.md) for local setup and [DEPLOYMENT.md](./DEPLOYMENT.md)
for deployment.

## Branch naming

`main` is the repo's sole integration branch. Every branch is created from
`main` and merges back into it via pull request — there is no separate
long-lived integration branch. Use one of these prefixes:

| Prefix          | Use for                                                    |
| --------------- | ---------------------------------------------------------- |
| `feature/...`   | New functionality (e.g. `feature/deployment-config`)       |
| `fix/...`       | Bug fixes                                                  |
| `chore/...`     | Tooling, dependencies, config, non-functional cleanup      |
| `docs/...`      | Documentation-only changes                                 |
| `milestone/...` | A tracked milestone deliverable (e.g. `milestone/m1c-...`) |

Keep the rest of the name short and kebab-case, e.g. `fix/admin-pagination-offset`.

## Commit message format

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/)
via commitlint (`.husky/commit-msg`, `commitlint.config.cjs`) — a commit that
doesn't match the format is rejected at commit time.

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`,
`build`, `perf`, `style`, `revert`. Scope is free-form today (e.g. `api`,
`web`, `admin`, `deploy`) — use the app or package the change lives in.

Examples:

```
feat(api): add health check endpoint
fix(web): correct broken nav link
chore(deploy): configure railway build settings
docs: add local development instructions
```

## Pull request checklist

One milestone (or one logical change) per pull request. Before opening a PR:

- [ ] Branch is named per the convention above
- [ ] All commits follow Conventional Commits
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm format:check` passes (or the diff is limited to files already
      excluded by known formatting gaps — call this out in the PR description)
- [ ] The app(s) you touched were verified running locally (`pnpm dev`)
- [ ] No secrets, `.env` files, or credentials are included in the diff
- [ ] `.env.example` is updated if you added or changed an environment variable
- [ ] README/DEPLOYMENT.md updated if setup or deployment steps changed
- [ ] PR description states what changed and why, plus any known issues or
      follow-ups

CI (`.github/workflows/ci.yml`) re-runs format check, lint, typecheck, unit
tests, e2e tests, and build on every PR — it must be green before merge.

## Coding standards

- **TypeScript everywhere**, strict mode as configured in
  `packages/config/typescript`. Don't add `any` or `@ts-ignore` to route
  around a type error — fix the type.
- **Shared config, not local overrides.** ESLint, Prettier, and TypeScript
  config are centralized in `packages/config`; apps extend it rather than
  redefining rules. If a rule genuinely needs to change, change it there so
  every app stays consistent.
- **Shared code lives in `packages/`.** Cross-app types go in
  `packages/types`, cross-app UI in `packages/ui`. Don't duplicate a type or
  component across `apps/web` and `apps/admin` — share it.
- **No dead scaffolding.** Don't leave commented-out code, unused exports, or
  half-finished abstractions in a merged PR.
- **No infrastructure creep.** Per the current milestone constraints: no
  Docker, no local database, no Redis, no Kubernetes, and no other added
  infrastructure unless a milestone explicitly calls for it. Local dev talks
  directly to cloud Supabase; keep it that way.
- **Comments explain why, not what.** Only comment on non-obvious
  constraints, workarounds, or invariants — not on things the code already
  says by being well-named.
- **AI-generated changes follow the same bar as human ones** — the checklist
  above and this document apply regardless of who (or what) wrote the diff.

## Testing requirements

- New backend logic (services, controllers) needs unit tests
  (`apps/api/src/**/*.spec.ts`, run via `pnpm test`).
- Changes to database-facing behavior (health checks, CRUD endpoints) need
  e2e coverage (`apps/api/test`, run via `pnpm --filter @maya-x/api test:e2e`)
  against a real database — CI provides one automatically; locally this
  needs `DATABASE_URL`/`DIRECT_URL` pointed at a reachable Postgres (your
  Supabase project, or another database you control for test purposes).
- Don't mock the database in tests that are meant to prove real behavior —
  the existing e2e suite intentionally runs against a real Postgres so it
  proves the migration + query path actually works, not just that the code
  compiles.
- A PR that changes behavior without a corresponding test change should
  explain why in the PR description (e.g. docs-only, config-only changes
  don't need new tests).
