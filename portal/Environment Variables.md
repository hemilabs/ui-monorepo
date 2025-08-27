# Environment Variables

When adding/removing environment variables, check if updates are required in any of the following places:

## Documentation

- portal/README.md

## Default values

Any environment variable that can is shared across all environments and is not a secret can be added in:

- portal/.env

## Security headers

Changes related to security headers - for example, when adding a new external url to fetch from, or download images from.

- portal/scripts/generateServerConfig.js

## Instrumentation

Changes related to Sentry:

- portal/instrumentation-client.ts

## Actions

Update these files to forward variables from the CI environment (Github Actions) to the building process:

- .github/actions/deploy-portal
- .github/workflows/hostinger-deployment.yml
