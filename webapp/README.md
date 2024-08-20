# Webapp

## Project setup

### Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `NEXT_PUBLIC_` is required for the variables to be available in the browser. A few variables can be set locally (in a `.env.local`), in addition to the ones already defined in the `.env`

```bash
NEXT_PUBLIC_FEATURE_FLAG_ENABLE_BTC_TUNNEL=<true|false> # Enable the bitcoin tunnel feature
NEXT_PUBLIC_WORKERS_DEBUG_ENABLE=<true|false> # enable logging on web workers
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

Inside the `webapp` folder, create a `.env.production` with the following configuration:

```sh
NEXT_PUBLIC_TESTNET_MODE=<true|false> # Depending on which network is being deployed
```

(as well as any other env variable of the list defined above)

and then run the following command:

```sh
npm run build
```

The .out folder's content should be deployed as a static page.
