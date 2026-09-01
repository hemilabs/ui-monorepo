# Environment Variables

When adding/removing environment variables, check if updates are required in any of the following places:

## Documentation

- portal/README.md
- docs/DOMAIN.md, when the variable is named in it (feature flags usually are)

## Default values

Any environment variable that can is shared across all environments and is not a secret can be added in:

- portal/.env

## Security headers

Changes related to security headers - for example, when adding a new external url to fetch from, or download images from.

- portal/utils/securityHeaders.ts

## Instrumentation

Changes related to Sentry:

- portal/instrument.ts
- portal/vite.config.ts

## Actions

Update these files to forward variables from the CI environment (Github Actions) to the building process:

- .github/actions/deploy-portal
- .github/workflows/hostinger-deployment.yml

Both still pass the `NEXT_PUBLIC_` names. That holds only while `main` builds with Next, so the deploy step of the migration ([#2194](https://github.com/hemilabs/ui-monorepo/issues/2194)) has to land before this branch reaches `main`: `vite build` ignores anything not prefixed `VITE_`, so every value CI provides would be dropped and the defaults committed in `portal/.env` would win, silently and with a green build. That step retires both files, moving the build to Cloudflare where the variables are configured per environment.
