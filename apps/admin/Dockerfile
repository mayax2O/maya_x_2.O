# syntax=docker/dockerfile:1
#
# Multi-stage build for @maya-x/admin (Next.js Admin Panel).
# Same rationale as apps/web/Dockerfile — build context must be the
# monorepo root; this container is for local/staging parity, with Vercel
# as the primary production deploy path.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm --filter @maya-x/admin... build

FROM node:20-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/admin
EXPOSE 3001
CMD ["pnpm", "start"]
