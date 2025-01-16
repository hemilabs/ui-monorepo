# Webapp

## Project setup

### Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `NEXT_PUBLIC_` is required for the variables to be available in the browser. A few variables can be set locally (in a `.env.local`), in addition to the ones already defined in the `.env`.

```sh
NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_SEPOLIA=<url> # Optional - Used to override the Hemi Sepolia RPC URL
NEXT_PUBLIC_CUSTOM_RPC_URL_SEPOLIA=<url> # Optional - Used to override the Sepolia RPC URL
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL=<true|false> # Enable the bitcoin tunnel feature
NEXT_PUBLIC_WORKERS_DEBUG_ENABLE=<true|false> # enable logging on web workers
# These env variables are required for Enabling Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=<true|false> # Enable Analytics with Umami
NEXT_PUBLIC_ANALYTICS_URL=<url> # Umami analytics URL
NEXT_PUBLIC_ANALYTICS_WEBSITE_ID=<string> # Umami website ID
# These env variables are required for Enabling the fallowing features
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL=<true|false> # Enable BTC tunnel
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_MAINNET=<true|false> # Enable mainnet network
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_STAKE_CAMPAIGN=<true|false> # Enable Staking Campaign

# The following variables could be used to customize the contracts addresses used by Hemi (for example, for testing with a forked blockchain):
NEXT_PUBLIC_ADDRESS_MANAGER=<address>
NEXT_PUBLIC_L2_BRIDGE=<address>
NEXT_PUBLIC_L2_OUTPUT_ORACLE_PROXY=<address>
NEXT_PUBLIC_OPTIMISM_PORTAL_PROXY=<address>
NEXT_PUBLIC_PROXY_OVM_L1_CROSS_DOMAIN_MESSENGER=<address>
NEXT_PUBLIC_PROXY_OVM_L1_STANDARD_BRIDGE=<address>
```

If not defined, the contracts addresses used will be the ones defined in [hemi-viem](https://github.com/hemilabs/hemi-viem).

## Deployment

Run the following command:

```sh
npm run build
```

The .out folder's content should be deployed as a static page.
