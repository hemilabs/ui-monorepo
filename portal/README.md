# Portal

The Portal is a Web3 app that allows users to interact with Hemi, an L2 that integrates Ethereum with Bitcoin. Users can tunnel their assets from EVM chains to Hemi, and viceversa, as well as participate in other activities.

## Structure

The portal is being migrated from Next to Vite (see [#2194](https://github.com/hemilabs/ui-monorepo/issues/2194)). The build runs on Vite and produces a static bundle, and routing is now react-router: `app.tsx` at the root holds the route table, and `main.tsx` is the entry. It has never relied on SSR. Every page is wired in `app.tsx`.

Some relevant folders are:

- [/app](./app/) folder, which holds the pages and their co-located `_components`/`_hooks`/`_utils`. The `[locale]` folder name is a leftover from the Next app router and no longer drives routing, which `app.tsx` does.
- [/components](./components/) folder, which contains reusable components to the entire app that are not tied to a specific page.
- [/hooks](./hooks/) folder, which contains reusable hooks to the entire app that are not tied to a specific page.
- [/messages/](./messages/) folder, which contain a file per locale with all the translated resources.
- [/public](./public/) folder, which is served verbatim at the site root.
- [/test](./test/) folder, which contains some tests for different portal files. These tests are for plain Typescript functions, and not for components.
- [/types](./types/) folder, which contains many reusable Typescript types across the entire app
- [/utils](./utils/) folder, which contains most of the logic that is not tied to UI.

## Setup

Follow the steps in the [main README](../README.md). No extra actions are needed.

### Configuration and Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `VITE_` is required: Vite only exposes variables carrying it to the browser, and inlines them at build time. A few variables can be set locally (in a `.env.local`), in addition to the ones already defined in the `.env`.

> If you have a `.env.local` from before the Vite migration, rename its keys from `NEXT_PUBLIC_` to `VITE_`. It is gitignored, so the rename does not reach it on its own, and a stale key is read as `undefined` without any warning.

This is the list of all variables that can be configured:

```sh
# Use this variables to override RPC urls per chain. In order to join multiple RPC urls, join them with the "+" character.
# For example VITE_CUSTOM_RPC_URL_SEPOLIA="https://rpc1.testnet.com/rpc+https://rpc2.testnet.com/rpc"
VITE_CUSTOM_RPC_URL_HEMI_MAINNET=<urls>
VITE_CUSTOM_RPC_URL_HEMI_SEPOLIA=<urls>
VITE_CUSTOM_RPC_URL_MAINNET=<urls>
VITE_CUSTOM_RPC_URL_SEPOLIA=<urls>
# enable logging on web workers
VITE_WORKERS_DEBUG_ENABLE=<true|false>
# These env variables are required for Enabling Analytics
VITE_ENABLE_ANALYTICS=<true|false> # Enable Analytics with Umami
VITE_ANALYTICS_URL=<url> # Umami analytics URL
VITE_ANALYTICS_WEBSITE_ID=<string> # Umami website ID
# These env variables are required for enabling the following features
VITE_ENABLE_HEMI_EARN_PAGE=<true|false> # Enable the Hemi Earn page
VITE_ENABLE_STAKE_GOVERNANCE_TESTNET=<true|false> # Enable stake governance on Testnet, for local development
VITE_ENABLE_STAKE_TESTNET=<true|false> # Enable Stake campaign on Testnet, for local development
VITE_ENABLE_CLAIM_REWARDS_TESTNET=<true|false> # Enable claim rewards on Testnet, for local development
# Bitcoin configuring
VITE_BITCOIN_PAST_VAULTS_MAINNET=1,2 # Comma-separated list of past vault indexes. Do not include the active ones.
VITE_BITCOIN_PAST_VAULTS_SEPOLIA=1,2,3 # Comma-separated list of past vault indexes. Do not include the active ones.
VITE_DEFAULT_BITCOIN_VAULT_MAINNET=3 # Vault index to use for bitcoin in hemi mainnet, when the deposit and withdrawal ones are not set. Defaults to 0
VITE_DEFAULT_BITCOIN_VAULT_SEPOLIA=4 # Vault index to use for bitcoin in hemi sepolia, when the deposit and withdrawal ones are not set. Defaults to 0
VITE_DEFAULT_BITCOIN_DEPOSIT_VAULT_MAINNET=5 # Vault index to deposit bitcoin in hemi mainnet. Defaults to VITE_DEFAULT_BITCOIN_VAULT_MAINNET
VITE_DEFAULT_BITCOIN_DEPOSIT_VAULT_SEPOLIA=6 # Vault index to deposit bitcoin in hemi sepolia. Defaults to VITE_DEFAULT_BITCOIN_VAULT_SEPOLIA
VITE_DEFAULT_BITCOIN_WITHDRAWAL_VAULT_MAINNET=3 # Vault index to withdraw bitcoin from hemi mainnet. Defaults to VITE_DEFAULT_BITCOIN_VAULT_MAINNET
VITE_DEFAULT_BITCOIN_WITHDRAWAL_VAULT_SEPOLIA=4 # Vault index to withdraw bitcoin from hemi sepolia. Defaults to VITE_DEFAULT_BITCOIN_VAULT_SEPOLIA
VITE_BTC_INPUTS_SIZE=105 # Assumed size in vbytes of a single transaction input, used to estimate bitcoin fees
VITE_BTC_OUTPUTS_SIZE=25 # Assumed size in vbytes of a single transaction output, used to estimate bitcoin fees
# Backend API URL
VITE_PORTAL_API_URL=<url> # To get the token prices, user points, TVL and more
VITE_VETRO_API_URL=<url> # Vetro API URL; powers the Hemi Earn page (variable-stake APY and user rewards)
# The following variables could be used to customize the contracts addresses used by Hemi (for example, for testing with a forked blockchain):
VITE_ADDRESS_MANAGER=<address>
VITE_L2_BRIDGE=<address>
VITE_L2_OUTPUT_ORACLE_PROXY=<address>
VITE_OPTIMISM_PORTAL_PROXY=<address>
VITE_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER=<address>
VITE_PROXY_OVM_L1_STANDARD_BRIDGE=<address>
# Use it to enable wallet connect
VITE_WALLET_CONNECT_PROJECT_ID=<wallet-connect-id>
# Error reporting with Sentry
VITE_SENTRY_DSN=<dsn> # Sentry DSN. Also what enables the build-time plugin
VITE_SENTRY_FILTER_KEY_ID=<string> # Application key used to tell first-party frames from third-party ones. The filtering is skipped when it does not reach the build
VITE_SENTRY_RELEASE=<string> # Release name, in the "portal@yyyymmdd_sequence" format. Envelopes not matching it are rewritten
VITE_TRACES_SAMPLE_RATE=<number> # Ratio of transactions sampled for tracing. Ignored when not a number
# Read at build time by vite.config.ts, never shipped to the browser, hence no VITE_ prefix
PORTAL_SITE_URL=<url> # Base URL the sitemap is built from. Without it no sitemap.xml is emitted
SENTRY_AUTH_TOKEN=<token> # Authorizes the source map upload
SENTRY_ENVIRONMENT=<string> # Environment the release is deployed to. Together with VITE_SENTRY_RELEASE it is what names the release
SENTRY_ORG=<string> # Sentry organization slug
SENTRY_PROJECT=<string> # Sentry project slug
```

If not defined, the contracts addresses used will be the ones defined in [hemi-viem](https://github.com/hemilabs/hemi-viem).

See [Environment Variables](./Environment%20Variables.md) to ensure changes to the list above are done properly.

## Running locally

Use the following command:

```sh
pnpm dev
```

## Testing

Run tests with the following command:

```sh
pnpm test
```

## Local sandbox for Hemi Earn

To test the Hemi Earn UI end-to-end against a controlled Anvil fork, see [`scripts/hemi-earn/README.md`](./scripts/hemi-earn/README.md). The sandbox deploys the required mocks and funds a test account so the UI can be exercised without external tooling.

## Building and Deployment

Run the following command:

```sh
pnpm build
```

The `dist` folder's content should be deployed as a static page.
