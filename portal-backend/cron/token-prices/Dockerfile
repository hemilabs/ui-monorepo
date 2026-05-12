FROM node:24.14.0-alpine3.23

# Patch vulnerabilities
RUN apk update
RUN apk add --upgrade musl=1.2.5-r23 musl-utils=1.2.5-r23 
RUN apk add --upgrade openssl=3.5.6-r0
RUN npm install --global npm@11.12.0
# Keep pnpm version in sync with the `packageManager` field in the root package.json.
# Hardcoded here because the build context is this directory only — see general-coding.md.
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json .
RUN pnpm install --prod

USER node

COPY . .

CMD ["pnpm", "run", "start"]
