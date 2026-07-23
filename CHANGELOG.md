# Changelog

All notable changes to MAYA_X 2.0 are documented in this file. Dates reflect
when work merged into `main`. Versions before `v1.0.0` were not tagged in
git; they are reconstructed here from merged milestone history for record
purposes and marked accordingly.

This file, [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), and
[`README.md`](./README.md) are kept in sync after every completed milestone.

## [Unreleased]

- Documentation & Project Audit — `PROJECT_STATUS.md` rewritten as the
  single source of truth for live project state; `CHANGELOG.md` created;
  `README.md` updated to reflect the live production deployment.

## Post-`v1.0.0` (untagged, merged to `main`)

### Auth/CORS Production Audit — merged (PR #10)

- Added Vercel preview-deployment CORS support via a scoped
  project-slug regex pattern (`CORS_VERCEL_PREVIEW_PROJECTS`), never a
  bare wildcard.
- Added origin-list parsing that tolerates a wrapped-in-quotes env var
  value (`parseOriginList`), fixing a production misconfiguration
  footgun.
- Added 16 unit tests (`cors.util.spec.ts`) and 6 e2e tests
  (`cors.e2e-spec.ts`) covering preflight, login, refresh, and logout
  across allowed/blocked/preview origins.

### M6 — Media Library & Asset Management — merged (PR #9)

- Added Cloudinary-backed Media Library: upload, folders, search, bulk
  actions, SHA-256 duplicate detection.
- Added `MediaAsset`, `MediaFolder`, `MediaUsage` Prisma models;
  migrated `TalentMedia` to reference `MediaAsset` by foreign key.
- Added admin Media Library UI and a media picker in the Talent
  gallery editor, replacing raw URL fields.
- Production polish pass (same PR): Trash + Restore (soft-delete via
  `deletedAt`), EXIF/metadata stripping (`strip_profile`), standardized
  `f_auto,q_auto` delivery and thumbnail/medium/large/original image
  variants, nullable AI-ready metadata fields on `MediaAsset`, a Media
  Dashboard stats endpoint, and a migration rollback/scalability review
  (documented in `DEPLOYMENT.md`).

## `v1.0.0` (git tag, points at the M5B merge commit)

### M5B — Membership & Payment — merged

- Added membership plan browsing and subscription purchase.
- Added Razorpay order creation, webhook signature verification, and
  admin payment reconciliation.
- Coupons/discounts explicitly deferred out of scope.

### M5A — Booking System — merged

- Added guest and member booking submission, an admin review queue,
  a status state machine (`submitted → under_review → contacted →
confirmed / declined / expired / cancelled`), and an append-only
  status history audit trail.

### M4 — Admin Dashboard & Talent Management — merged

- Added the admin panel application: talent catalog CRUD, categories,
  cities, and locations management, RBAC-gated.

### M3 — Authentication & Authorization Hardening — merged

- Hardened JWT access/refresh flow: refresh token rotation and
  revocation, argon2id password hashing, dual JWT secrets, brute-force
  throttling on login/register.

### M2 — Public Website UI — partial (~60%)

- Built the public site UI; talent catalog, testimonials, FAQs, and
  categories still read static mock data rather than the live API.

### M1 — Identity & Access — merged

- Added user registration/login, JWT + refresh tokens, and role-based
  access control foundations.

### M0 — Monorepo Foundations — merged

- Established the pnpm workspace monorepo, CI/CD (GitHub Actions), and
  deployment configuration for Railway (API) and Vercel (web/admin).

---

_For full current-state detail (endpoint counts, test counts, per-area
completion percentages, known issues), see [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)._
