# Build context is the repo root (see docker-compose.yml / the CI workflows).
# Every image in this repo follows the same multi-stage `pnpm deploy` shape so
# that any service can pull workspace packages without changing build wiring.
# Multi-stage keeps the runtime image slim: only the self-contained `pnpm deploy`
# output ships, not the workspace source or dev tooling.

# ---- build: install the workspace, deploy ----
FROM node:24.14.0-alpine3.23 AS build
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter hemi-supply-cron...
# --legacy: this workspace doesn't set inject-workspace-packages, which pnpm v10's
# default deploy now requires.
RUN pnpm deploy --filter=hemi-supply-cron --prod --legacy /app

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

COPY --from=build --chown=node:node /app .

USER node

CMD ["pnpm", "run", "start"]
