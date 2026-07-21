# syntax=docker/dockerfile:1
#
# Multi-stage build for @maya-x/web (Next.js public site).
# Build context MUST be the monorepo root — see apps/api/Dockerfile for the
# same pnpm-workspace rationale.
#
# Production frontend deploys go to Vercel directly from Git (per the
# Enterprise Architecture's deployment topology); this Dockerfile exists for
# local/staging container parity and disaster-recovery portability, not as
# the primary production deploy path.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter @maya-x/web... build

FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
