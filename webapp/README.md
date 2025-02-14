# Webapp

## Project setup

### Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `NEXT_PUBLIC_` is required for the variables to be available in the browser. A few variables can be set locally (in a `.env.local`), in addition to the ones already defined in the `.env`.

```sh
# Use this variables to override RPC urls per chain. In order to join multiple RPC urls, join them with the "+" character.
# For example NEXT_PUBLIC_CUSTOM_RPC_URL_SEPOLIA="https://rpc1.testnet.com/rpc+https://rpc2.testnet.com/rpc"
NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_MAINNET=<urls>
NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_SEPOLIA=<urls>
NEXT_PUBLIC_CUSTOM_RPC_URL_MAINNET=<urls>
NEXT_PUBLIC_CUSTOM_RPC_URL_SEPOLIA=<urls>
# enable logging on web workers
NEXT_PUBLIC_WORKERS_DEBUG_ENABLE=<true|false>
# These env variables are required for Enabling Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=<true|false> # Enable Analytics with Umami
NEXT_PUBLIC_ANALYTICS_URL=<url> # Umami analytics URL
NEXT_PUBLIC_ANALYTICS_WEBSITE_ID=<string> # Umami website ID
# These env variables are required for Enabling the fallowing features
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL=<true|false> # Enable BTC tunnel
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_MAINNET=<true|false> # Enable mainnet network
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_STAKE_CAMPAIGN=<true|false> # Enable Stake Campaign
NEXT_PUBLIC_ENABLE_STAKE_TESTNET=<true|false> # Enable Stake campaign on Testnet, for local development
# Bitcoin configuring
NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_MAINNET=2 # Vault index to use for bitcoin in hemi mainnet. Defaults to 0
NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_SEPOLIA=1 # Vault index to use for bitcoin in hemi sepolia. Defaults to 0
# Enable subgraphs for syncing history
NEXT_PUBLIC_FEATURE_FLAG_SYNC_SUBGRAPH=<true|false>
# Subgraph configuration per chain
# Use this for querying a published decentralized subgraph - the API key works for all chains
NEXT_PUBLIC_SUBGRAPH_API_KEY=<api-key>
# Use this for querying a published decentralized subgraph
NEXT_PUBLIC_SUBGRAPH_MAINNET_ID=<subgraph-id>
NEXT_PUBLIC_SUBGRAPH_SEPOLIA_ID=<subgraph-id>
# Use this to configure a complete Subgraph Endpoint URL (for example, when running locally)
NEXT_PUBLIC_SUBGRAPH_MAINNET_URL=<url>
NEXT_PUBLIC_SUBGRAPH_SEPOLIA_URL=<url>

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
