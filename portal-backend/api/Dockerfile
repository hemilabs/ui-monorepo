# Build context is the repo root (see docker-compose.yml / the CI workflows)
# because portal-backend/api depends on workspace packages (ve-hemi-actions,
# ve-hemi-rewards) that live outside this folder.
#
# This is a multi-stage build on purpose: the `build` stage needs the whole repo
# + devDependencies (typescript, etc.) to install and compile, which is heavy.
# The final stage copies only the self-contained `pnpm deploy` output, so the
# shipped image stays slim instead of carrying the full monorepo source, dev
# tooling, and intermediate node_modules.

# ---- build: install the workspace, compile the workspace packages, deploy ----
FROM node:24.14.0-alpine3.23 AS build
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter portal-backend...
# Node can't type-strip .ts under node_modules, so compile the workspace packages
# the api consumes to JS. Their package.json "compiled" export condition
# points at this dist; the runtime activates it via NODE_OPTIONS below.
RUN pnpm --filter ve-hemi-actions --filter ve-hemi-rewards --filter hemi-earn-actions run build
# Self-contained app dir: prod deps + api files, workspace packages copied in.
# --legacy: this workspace doesn't set inject-workspace-packages, which pnpm v10's
# default deploy now requires.
RUN pnpm deploy --filter=portal-backend --prod --legacy /app

# ---- runtime: minimal patched image running the deployed app ----
FROM node:24.14.0-alpine3.23

# Patch vulnerabilities
RUN apk update
RUN apk add --upgrade musl=1.2.5-r23 musl-utils=1.2.5-r23
RUN apk add --upgrade openssl=3.5.7-r0
RUN corepack enable
# npm is unused at runtime (the app uses pnpm); removing it shrinks the image
# and eliminates its transitive vulnerabilities (e.g. sigstore).
RUN npm uninstall --global npm
# Skip corepack's interactive download prompt so the `node` user can fetch
# pnpm on first container start without a TTY to approve it.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app

ENV NODE_ENV=production
# Resolve the workspace action packages to their compiled JS. They ship raw .ts
# for local dev and the portal bundler (the exports "default"); Node can't strip
# .ts under node_modules, so here we opt into their "compiled" export condition.
ENV NODE_OPTIONS=--conditions=compiled

COPY --from=build --chown=node:node /app .

USER node

EXPOSE 3006

CMD ["pnpm", "run", "start"]
