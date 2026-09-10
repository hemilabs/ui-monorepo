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

## Deployment

Cloudflare builds and serves the portal through its Git integration. Add the variable to the Cloudflare project, per environment.
