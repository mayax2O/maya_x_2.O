# MAYA_X_2.0 — Planning & Design Documentation

Draft v1.0 documents produced during pre-implementation planning, in dependency order. Each builds on the ones before it; open questions and assumptions are flagged inline in every document rather than silently resolved.

| # | Document | Contents |
|---|---|---|
| 01 | [Software Requirements Specification](01-srs/MAYA_X_2.0_SRS.docx) | IEEE-style SRS — functional/non-functional requirements, workflows, security, assumptions, risks, open questions |
| 02 | [Product Requirements Document](02-prd/MAYA_X_2.0_PRD.docx) | Vision, success metrics, personas, MoSCoW priorities, user stories, acceptance criteria, MVP scope |
| 03 | [Enterprise Architecture](03-architecture/MAYA_X_2.0_Enterprise_Architecture.docx) | High-level/frontend/backend/deployment architecture, auth/booking/payment/notification flows, security |
| 04 | [Database Design](04-database/) | Full PostgreSQL schema — [DDL & design doc](04-database/MAYA_X_2.0_Database_Design.docx), [ER diagram source](04-database/erd.mmd) / [rendered](04-database/MAYA_X_ERD.md) |
| 05 | [REST API Specification](05-api/MAYA_X_2.0_REST_API_Specification.docx) | OpenAPI-style endpoint documentation for every module |
| 06 | [Design System](06-design-system/design-system.html) | Proposed visual identity, components, sitemap, and user flow diagrams (open the HTML file in a browser) |
| 07 | [Implementation Plan](07-planning/) | [Milestones & effort estimate](07-planning/MAYA_X_2.0_Implementation_Milestones.docx), [monorepo layout](07-planning/MAYA_X_2.0_Monorepo_Layout.docx) |

## Status

All documents are **drafts pending stakeholder review**. Each flags its own open questions (⚑ red call-outs) and assumptions (grey call-outs) — most notably:

- Whether Booking Requests involve any online payment, or are settled entirely offline after Agency contact (affects Database §5, API §7, Architecture §8).
- Membership tier structure, pricing, and benefits (undefined in the original brief).
- Notification channel(s) beyond the assumed email baseline.
- Whether Talent has any self-service login, or is Admin-managed only.

See SRS §22 for the full consolidated list.
