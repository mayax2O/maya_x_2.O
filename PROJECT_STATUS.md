# MAYA_X 2.0

---

## 🚀 Project Snapshot

- **Current Status**: Deployed to production (backend, public site, admin panel all live)
- **Current Development Version**: `v1.0.0` (git tag) — `main` has advanced past this tag; see Known Issues
- **Latest Git Tag**: `v1.0.0`
- **Repository**: [github.com/mayax2O/maya_x_2.O](https://github.com/mayax2O/maya_x_2.O)
- **Overall Completion**: ~75% of originally planned scope (see Project Completion below)
- **Current Phase**: Post-M6 hardening / documentation
- **Current Milestone**: None active — awaiting direction (candidates: Coupons, Notifications, Reporting/Analytics, SEO/Performance/Accessibility, or public-site live-data wiring)
- **Production Readiness**: MVP/beta-ready — see Project Health
- **Live Deployments**: Backend (Railway), Public site (Vercel), Admin panel (Vercel), Database (Supabase)
- **Current Focus**: Documentation & project audit
- **Last Updated**: 2026-07-23

---

## 🌐 Live Environment

- **Website**: https://hokolgal.fun (custom domain, project owner-confirmed)
- **Admin Panel**: https://maya-x-2-o-admin.vercel.app
- **Backend API**: https://mayaapx2x.up.railway.app
- **Health Endpoint**: `GET /health` (configured as Railway's healthcheck path in `railway.json`) — live response **Not Verified** in this session (no outbound network access from this sandbox to the production host)
- **Database Health**: `GET /health/db` exists in the API (`HealthController`) — live response **Not Verified** in this session
- **Railway**: Production — backend API, Docker build
- **Vercel**: Production — both public site and admin panel
- **Supabase**: PostgreSQL, connected via pooled (`DATABASE_URL`) + direct (`DIRECT_URL`) connection strings
- **Custom Domain**: https://hokolgal.fun (project owner-confirmed; not present in repo config — Vercel custom domains are configured in the Vercel dashboard, not in this codebase)
- **SSL / HTTPS**: Enabled (project owner-confirmed for the custom domain; Vercel and Railway both provision TLS automatically on their platform subdomains by default)
- **CI/CD**: GitHub Actions (`ci.yml`) runs lint, typecheck, unit tests, e2e tests (real Postgres service container), and build on every PR/push to `main`

---

## 📦 Repository Information

- **Repository**: `mayax2O/maya_x_2.O`
- **Default Branch**: `main`
- **Remote Branches**: 9 (`main`, `claude/auth-cors-audit`, `claude/m5b-membership-payment`, `claude/m6-media-library`, `claude/open-repository-36ktwf`, `claude/project-dev-status-wvbaqx`, `feature/deployment-config`, `milestone/m1c-local-dev-deployment-readiness`, `milestone/m4-admin-dashboard-talent-management`)
- **Latest Tag**: `v1.0.0` (points at commit `1969a1a`, the M5B merge — `main` has since moved ahead)
- **Current Development Version**: `main` @ commit `ca1b357` (post-M6, post auth/CORS audit) — untagged
- **Total PRs**: 10
- **Merged PRs**: 9
- **Open PRs**: 1 (PR #3 — stale draft targeting a non-`main` base branch; its content is already merged into `main` via a different commit)
- **Latest Release**: None — no GitHub Releases have been published for this repository (tags exist, but no Release objects)

---

## 🏗 Tech Stack

- **Backend**: NestJS 10 (`@nestjs/core` ^10.4.15)
- **Frontend**: Next.js 15 (`^15.5.20`, App Router) — public site
- **Admin**: Next.js 15 (`^15.5.20`, App Router) — separate app, same version
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma 5 (`^5.22.0`)
- **Authentication**: JWT (access + refresh), argon2id password hashing
- **Payments**: Razorpay SDK
- **Media Storage**: Cloudinary SDK
- **Deployment**: Railway (backend, Docker), Vercel (both frontends)
- **CI/CD**: GitHub Actions
- **Testing**: Jest, ts-jest, Supertest
- **Package Manager**: pnpm `9.15.0` (workspaces), Node `20.18.1`

---

## 📁 Repository Structure

- **`apps/`** — three deployable applications:
  - `api/` — NestJS REST API (19 controllers)
  - `web/` — Next.js public site
  - `admin/` — Next.js admin panel
- **`packages/`** — shared workspace libraries: `types/`, `ui/`, `config/`
- **`docs/`** — SRS, PRD, Enterprise Architecture, Database Design, REST API Specification (all `.docx`), plus a Markdown ERD (`docs/04-database/MAYA_X_ERD.md`, `erd.mmd`) and a design-system HTML reference
- **`scripts/`** — no dedicated top-level `scripts/` directory exists; operational scripts live as `package.json` scripts within each workspace
- **`configs/`** — no top-level `configs/` directory; shared config lives in `packages/config`, plus root-level `tsconfig.base.json`, `commitlint.config.cjs`, `.editorconfig`
- **Shared libraries**: `packages/types` (shared TS types), `packages/ui` (shared UI primitives/Tailwind preset), `packages/config` (shared tsconfig/Tailwind config)
- Root also contains: `railway.json`, `infra/docker/`, `.github/workflows/`, `README.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`, `LICENSE`

---

## ✅ Completed Milestones

| Milestone       | Status  | Completion | Description                                                       |
| --------------- | ------- | ---------- | ----------------------------------------------------------------- |
| M0              | Done    | 100%       | Monorepo foundations, CI/CD, deploy configs                       |
| M1              | Done    | 100%       | Identity & Access: registration/login, JWT + refresh, RBAC        |
| M2              | Partial | ~60%       | Public website UI built, but still reads static mock data         |
| M3              | Done    | 100%       | Authentication & authorization hardening                          |
| M4              | Done    | 100%       | Admin dashboard & talent management                               |
| M5A             | Done    | 100%       | Booking System (guest + member, admin review lifecycle)           |
| M5B             | Done    | 100%*      | Membership & Payment (Razorpay) — *coupons explicitly deferred    |
| M6              | Done    | 100%       | Media Library (Cloudinary) + production polish pass               |
| Auth/CORS Audit | Done    | 100%       | Vercel preview-deployment CORS support, security hardening review |

---

## 🚀 Current Features

**Implemented**

- User registration/login, JWT access + refresh tokens, refresh rotation/revocation
- Admin RBAC (Role/AdminUserRole)
- Talent catalog CRUD + categories, cities, locations management
- Public talent lookup endpoint
- Guest + Member booking submission, admin review queue, status state machine, audit history
- Membership plan browsing + subscription purchase
- Razorpay order creation + webhook verification, admin payment reconciliation
- Media Library: upload, folders, search, Trash/restore, bulk actions, image variants, EXIF stripping, dashboard stats
- CORS hardened for production + Vercel preview deployments

**In Progress**

- None — no feature branch is currently active beyond `main`

**Planned**

- Coupons
- Notifications (email/SMS/push)
- Reporting/Analytics
- Public site wired to live talent/testimonial/FAQ/category data
- SEO/Performance/Accessibility hardening

**Deprecated**

- None identified

---

## 🗄 Database Status

- **Tables**: `admin_users`, `users`, `roles`, `admin_user_roles`, `user_credentials`, `refresh_tokens`, `cities`, `locations`, `talent_categories`, `talents`, `talent_category_map`, `talent_media`, `booking_requests`, `booking_status_history`, `membership_plans`, `subscriptions`, `payments`, `media_folders`, `media_assets`, `media_usages`
- **Relationships**: standard FK relations per Prisma schema (e.g., `Talent` → `City`/`Location`/`TalentCategory` via join table; `TalentMedia` → `MediaAsset`; `BookingRequest` → `Talent`/`User`; `Subscription` → `MembershipPlan`; `Payment` → `Subscription`)
- **Migrations**: 7 applied (`init_admin_user_models`, `add_auth_tables`, `add_talent_catalog`, `add_booking`, `add_membership_payment`, `add_media_library`, `media_library_polish`)
- **Seed Data**: 1 super admin, 3 test users, 8 talent categories, 5 cities, 2 locations, 5 talents (with legacy media assets)
- **Prisma**: v5.22.0, schema at `apps/api/prisma/schema.prisma`

---

## 🔌 API Status

- **Approximate endpoint count**: 79 routes
- **Controllers**: 19
- **Modules**: `admins`, `auth`, `booking`, `cities`, `dashboard`, `health`, `locations`, `media`, `membership`, `payments`, `talent`, `talent-categories`, `users` (plus `app`, `config`, `database`, `common` support modules)
- **Versioning**: `/api/v1/` global prefix (root `/` and `/health*` excluded)
- **Validation**: Global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)
- **Security**: Helmet, JWT guards, RBAC guards, rate limiting (global + stricter per-endpoint), CORS allow-list

---

## 🔐 Authentication

- **Login**: `POST /auth/login`
- **Registration**: `POST /auth/register`
- **JWT**: access token (default 15m expiry)
- **Refresh Tokens**: default 30d expiry, rotated and revoked on use, stored hashed
- **RBAC**: `Role`/`AdminUserRole` join, enforced via `RolesGuard`
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `OptionalJwtAuthGuard` (for guest-or-member booking submission)
- **Cookies**: `refresh_token` — `httpOnly`, `Secure` in production, `SameSite=None` in production / `Lax` in development, scoped to `/api/v1/auth`
- **Security**: argon2id password hashing, dual JWT secrets (access/refresh), brute-force throttling on login/register endpoints

---

## 📅 Booking System

- **Current Status**: Fully implemented
- **Workflow**: `submitted → under_review → contacted → confirmed / declined / expired / cancelled`
- **Guest Booking**: supported (no account required)
- **Member Booking**: supported (authenticated user)
- **Admin Review**: dedicated queue + status-update endpoint + append-only status history audit trail
- **Payments**: not integrated with booking — bookings have no payment step by design

---

## 💎 Membership

- **Plans**: admin CRUD (`admin-membership.controller.ts`), public browse (`membership.controller.ts`)
- **Subscriptions**: purchase endpoint, one-active-subscription-per-user constraint, price-at-purchase snapshot
- **Management**: admin can create/update/deactivate plans
- **Payments**: tied to Razorpay order/webhook flow (see Payment section)

---

## 💳 Payment

- **Provider**: Razorpay
- **Webhook**: `POST /payments/webhook`, HMAC signature verification against raw request body
- **Verification**: `RazorpayGateway.verifyWebhookSignature`, idempotent order creation
- **Current Status**: Fully implemented; coupon/discount support explicitly out of scope (deferred)

---

## 🖼 Media Library

- **Upload**: `POST /media/upload`, mime/size/dimension validation, SHA-256 duplicate detection
- **Folders**: full CRUD, folder-scoped filtering
- **Cloudinary**: real SDK-backed gateway (`CloudinaryGatewayService`)
- **Optimization**: `f_auto,q_auto` + `strip_profile` (EXIF/metadata stripping) on all delivery URLs
- **Variants**: thumbnail/medium/large/original standardized sizes
- **Trash**: soft-delete via `deletedAt`, `DELETE /media/:id`
- **Restore**: `POST /media/:id/restore`; permanent delete via `DELETE /media/:id/permanent` (Trash-only)

---

## 🌍 Deployment

- **Railway**: Production — `apps/api`, Docker build (Debian-slim base image), `preDeployCommand` runs `prisma migrate deploy`
- **Vercel**: Production — `apps/web` and `apps/admin`, each a separate Vercel project
- **Supabase**: PostgreSQL, pooled + direct connection strings
- **Custom Domain**: https://hokolgal.fun (project owner-confirmed)
- **SSL**: Enabled (project owner-confirmed)
- **Health Checks**: `railway.json` configures `/health` as the Railway healthcheck path (timeout 100s, restart on failure, max 3 retries)
- **GitHub Actions**: `ci.yml` (lint/typecheck/test/e2e/build) + 3 manual `workflow_dispatch` deploy workflows (`deploy-api.yml`, `deploy-web.yml`, `deploy-admin.yml`)
- **Auto Deploy**: Railway and Vercel both post automated PR status comments (observed on PRs #9 and #10), indicating their native Git integrations are active and deploying automatically on push
- **Production Status**: Live per project owner confirmation; live HTTP response codes **Not Verified** in this session (no outbound network access from this sandbox)

---

## 🧪 Testing

- **Unit Tests**: 167 (20 suites) — all in `apps/api`
- **Integration Tests**: no separately-labeled integration suite; e2e tests fulfill this role (run against a real PostgreSQL instance)
- **E2E Tests**: 55 (13 suites) — all in `apps/api`
- **Frontend Tests**: 0 — no test files found in `apps/web` or `apps/admin`
- **Coverage**: not configured/measured — no coverage tooling present in CI or package scripts
- **CI Status**: last observed run (PR #10) passed — Green
- **Total Tests**: 222 (backend only)

---

## 🔒 Security

- **Helmet**: enabled globally (`app.use(helmet())`)
- **Validation**: global `ValidationPipe` (whitelist, forbid-unknown, transform)
- **Rate Limiting**: `@nestjs/throttler`, global default + stricter per-endpoint overrides (auth, booking submission, media upload)
- **CORS**: exact-match allow-list (`CORS_ORIGIN`) + scoped Vercel-preview-deployment pattern match (`CORS_VERCEL_PREVIEW_PROJECTS`) — never a wildcard
- **RBAC**: `Role`/`AdminUserRole`, enforced via guards
- **JWT**: dual secrets (access/refresh), configurable expiry
- **Password Hashing**: argon2id (OWASP-recommended parameters)
- **Security Headers**: via Helmet (CSP, HSTS, X-Content-Type-Options, etc. — confirmed present in a local server response during the prior CORS audit)
- **Known Risks**: no automated dependency/security scanning configured (no Dependabot, CodeQL, or similar workflow found in `.github/`)

---

## 📊 Project Completion

| Area           | Completion                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planning       | 100% (SRS/PRD/Architecture/DB design docs present)                                                                                                         |
| Documentation  | ~85% (README, DEPLOYMENT, CONTRIBUTING, this file present; API spec is a static `.docx`, not auto-generated)                                               |
| Infrastructure | 100% (CI/CD, Docker, Railway/Vercel configs all present and in use)                                                                                        |
| Backend        | 100% (all planned-so-far modules implemented and tested)                                                                                                   |
| Frontend       | ~60% (admin fully live-data-backed; public site still mock-data-backed for catalog/testimonials/FAQs)                                                      |
| Admin          | 100%                                                                                                                                                       |
| Database       | 100% (schema + migrations + seed all present and applied)                                                                                                  |
| Authentication | 100%                                                                                                                                                       |
| Booking        | 100%                                                                                                                                                       |
| Membership     | 100%                                                                                                                                                       |
| Payments       | 100% (coupons excluded by design)                                                                                                                          |
| Media Library  | 100%                                                                                                                                                       |
| Deployment     | 100% (live on Railway + Vercel, per project owner)                                                                                                         |
| Testing        | ~70% (backend thoroughly tested; 0% frontend test coverage)                                                                                                |
| Notifications  | 0% (not started)                                                                                                                                           |
| Analytics      | 0% (not started)                                                                                                                                           |
| SEO            | Not Verified (no dedicated SEO milestone/audit found in repo; `apps/web` has `robots.ts`/`sitemap.ts`, which is a baseline, not a completed SEO milestone) |
| AI             | 0% (schema has nullable AI-ready metadata fields on `MediaAsset`, but no AI feature is implemented)                                                        |
| **Overall**    | **~75%**                                                                                                                                                   |

---

## ⚠ Known Issues

- `v1.0.0` tag is stale — points at the M5B merge commit, not the current `main` tip (M6 + auth/CORS audit are ahead of it, untagged).
- `v0.4.0` tag exists locally in this session's clone but was never successfully pushed to GitHub (`git ls-remote --tags origin` shows only `v1.0.0`).
- PR #3 ("Cloud deployment configuration") is an open draft PR targeting a stale base branch (`claude/open-repository-36ktwf`, not `main`); its actual content is already merged into `main` via a different commit path.
- `apps/web`'s talent catalog, testimonials, FAQs, and categories still read static mock JSON (`apps/web/lib/mock/`), not the live API.
- No test coverage percentage is measured (no coverage tooling configured).
- No automated dependency/security scanning (Dependabot/CodeQL) configured.
- No CHANGELOG.md exists yet in the repository (this document introduces the practice of maintaining one going forward).

---

## 🎯 Next Milestone

Not yet decided by the project owner. The most logical next step per the existing roadmap (`docs/07-planning`, `README.md`'s own "Not yet started" list) is either **Notifications** or **wiring `apps/web`'s public talent catalog to live data** — both are prerequisites for a genuine public launch. Final choice is the project owner's decision.

---

## ❤️ Project Health

| Area            | Rating       | Justification                                                                                                                                                          |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture    | Good         | Clean module boundaries (NestJS feature modules), shared packages for types/UI/config, documented deviations from the original ERD in code comments                    |
| Backend         | Good         | 79 endpoints, 167 unit + 55 e2e tests passing, consistent DTO validation and error handling                                                                            |
| Frontend        | Fair         | Admin panel is fully live-data-backed and tested manually; public site still depends on static mock data for its core catalog                                          |
| Database        | Good         | 7 clean, additive migrations; seed data present; schema documented with rationale comments                                                                             |
| Documentation   | Good         | README, DEPLOYMENT, CONTRIBUTING, and this status file are current and detailed; formal SRS/PRD/API-spec docs exist but are static `.docx` files, not living documents |
| Testing         | Fair         | Strong backend coverage (222 tests); zero automated frontend tests                                                                                                     |
| Deployment      | Good         | Live on Railway + Vercel with a custom domain (per project owner), CI green on `main`                                                                                  |
| Security        | Good         | Helmet, argon2id, RBAC, rate limiting, hardened CORS; gap is the absence of automated dependency scanning                                                              |
| Maintainability | Good         | Consistent code conventions, extensive inline rationale comments, small/focused modules                                                                                |
| Scalability     | Not Verified | No load testing or scalability analysis found in the repository                                                                                                        |
| **Overall**     | **Good**     | A solid, well-tested MVP/beta platform with clear, documented gaps rather than hidden ones                                                                             |

---

## 📌 Executive Summary

MAYA_X 2.0 is a full-stack premium talent booking platform — a NestJS API and two Next.js 15 applications (public site and admin panel) in a pnpm monorepo, backed by Supabase PostgreSQL via Prisma. It is deployed to production: the backend runs on Railway, both frontends run on Vercel, and the platform is served under the custom domain **https://hokolgal.fun** with SSL/HTTPS enabled. The backend is mature — JWT authentication with RBAC, a full talent catalog, a complete booking lifecycle, Razorpay-powered membership payments, and a Cloudinary-backed media library are all implemented and covered by 222 passing automated tests. The admin panel is fully wired to live data; the public site's talent catalog, testimonials, and FAQs currently still use static mock content. Remaining roadmap items are coupons, real notifications, analytics/reporting, SEO/performance/accessibility hardening, and completing the public site's live-data integration. Future milestones will be selected by the project owner from this list.

---

_Last updated: 2026-07-23 — Documentation & Project Audit_
