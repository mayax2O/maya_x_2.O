# syntax=docker/dockerfile:1
#
# Multi-stage build for @maya-x/api (NestJS). Deploy target: Railway (see
# railway.json at the repo root, which points here via `build.dockerfilePath`
# and keeps the build context at the repo root — required below).
#
# Build context MUST be the monorepo root (see infra/docker/docker-compose.yml
# and the CI workflow) — pnpm workspaces require the full workspace graph
# (root lockfile + every package.json) to install correctly.
#
# Decision: this copies the full resolved node_modules into the runtime
# image rather than using `pnpm deploy`/prune for a slimmer image. That
# optimization is deferred to M9 (Launch Prep hardening) — not needed to
# prove the pipeline at M0, and premature here.
#
# Migrations are NOT run here — deliberately not baked into this image's
# startup, so a plain `docker run`/docker-compose use of this image never
# touches a database's schema by surprise. `prisma migrate deploy` runs as
# part of Railway's configured start command instead (see railway.json).
#
# Base image: Debian slim (bookworm), not Alpine. Prisma's query/schema
# engines are prebuilt native binaries dynamically linked against OpenSSL;
# Alpine's musl libc + minimal/absent libssl means the engine binary either
# can't resolve libssl.so at all, or resolves the wrong major version
# depending on the exact Alpine tag — this is a long-standing, still-open
# class of Prisma/Alpine bugs (the engine crashes before it can emit JSON,
# which is why Railway's start command sees non-JSON stderr and blows up
# parsing it as JSON, i.e. exactly this deployment's failure). Debian's
# glibc + explicit openssl package below give the engine a runtime it can
# always resolve deterministically, so this is a permanent fix rather than
# pinning apk package versions that can drift again on the next Alpine bump.

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
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
# @prisma/client's own postinstall hook looks for a schema at the workspace
# root and no-ops (ours is at apps/api/prisma/schema.prisma), so the client
# is left with its placeholder, model-less types after `pnpm install` above
# — generate explicitly, now that the full source (incl. the schema) has
# been copied in, and before `nest build` type-checks against it. Running
# this in the same Debian base as `runtime` (below) also ensures the
# generated "native" engine binaries are the ones that actually match the
# container they'll execute in.
RUN pnpm --filter @maya-x/api exec prisma generate
RUN pnpm --filter @maya-x/api... build

FROM node:20-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
