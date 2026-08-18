# Environment Variables

When adding/removing environment variables, check if updates are required in any of the following places:

## Documentation

- portal/README.md

## Default values

Any environment variable that can is shared across all environments and is not a secret can be added in:

- portal/.env

## Security headers

Changes related to security headers - for example, when adding a new external url to fetch from, or download images from.

The `portal/scripts/generateServerConfig.js` script that emitted the `.htaccess` was removed with the Next build. Its replacement is the Cloudflare Worker, which is added in the deploy step of the migration ([#2194](https://github.com/hemilabs/ui-monorepo/issues/2194)). Until then this branch ships no security headers, which is why it is not deployed anywhere.

## Instrumentation

Changes related to Sentry:

- portal/instrumentation-client.ts

## Actions

Update these files to forward variables from the CI environment (Github Actions) to the building process:

- .github/actions/deploy-portal
- .github/workflows/hostinger-deployment.yml
