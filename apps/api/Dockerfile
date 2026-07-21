# syntax=docker/dockerfile:1
#
# Multi-stage build for @maya-x/api (NestJS).
# Build context MUST be the monorepo root (see infra/docker/docker-compose.yml
# and the CI workflow) — pnpm workspaces require the full workspace graph
# (root lockfile + every package.json) to install correctly.
#
# Decision: this copies the full resolved node_modules into the runtime
# image rather than using `pnpm deploy`/prune for a slimmer image. That
# optimization is deferred to M9 (Launch Prep hardening) — not needed to
# prove the pipeline at M0, and premature here.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter @maya-x/api... build

FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
