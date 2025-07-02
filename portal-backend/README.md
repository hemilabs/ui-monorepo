# Portal Backend

The portal backend is composed by an API and several cron jobs.

## API

### Routes

#### `/btc-vaults/:chain-id`

Provides several metrics and status information about the BTC vaults in the given Hemi chain.

```console
$ curl http://localhost:3006/btc-vaults/743111
{"bitcoinChainData":{"bitcoin":{"height":901676},"bitcoinKit":{"height":901674,"blockHash":"0x0000000000000000000107cb02a6c19084b54a1d0e8504d3a96d8fdd10d2f62b","version":536944640,"previousBlockHash":"0x00000000000000000000a30d9d5025c11b17b2c44b176de0e284c84f59dacebb","merkleRoot":"0x05c2f62905f83beeb75131a245c1851705814d09165fdac50b74e0e4814607b2","timestamp":1750196887,"bits":386021892,"nonce":1816880925}},"tunnelManagerData":{"withdrawalsPaused":false},"vaultsData":[{"status":5,"vaultAddress":"0x3DA10b74Bd339E69C1De9408020ce640B012e8cc","balanceSats":0,"bitcoinCustodyAddress":"18AVmm853HVhibPHMc3JRLXMynzKAbj6Po","pendingWithdrawalAmountSat":0,"pendingWithdrawalCount":0},...]}
```

#### `/points/:address`

Provides the amount of Hemi points any user has earned through the **Incentivized Testnet**, **Hemi Staking** campaigns, etc.
Data is provided by [Absinthe](https://absinthe.network/).

```console
$ curl http://localhost:3006/0x85e0D9e73c12eFE889750f44422a77B544D48d17
{"points":270644}
```

#### `/prices`

Retrieves token prices (in USD) stored in a key/value store.

```console
$ curl http://localhost:3006/prices
{"prices":{"BTC":"94514.79193898945","M-BTC":"95894.52612269788","PUMPBTC":"95990.74415080296","WBTC":"95797.80677773379"},"time":"2025-02-17T23:12:35.803Z"}
```

#### `/tvl`

Computes and caches the TVL so the portal can have a value even if [Databox](https://databox.com/) is down or returns errors.

```console
$ curl http://localhost:3006/tvl
{"tvl":808500187.3738999}
```

### Configuration

These environment variables control how the cache works:

| Variable             | Description                                                       | Default                                    |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| ABSINTHE_API_KEY     | The JWT used to authenticate to the Absinthe GraphQL API.         |                                            |
| ABSINTHE_API_URL     | The Absinthe GraphQL API URL.                                     | `https://gql3.absinthe.network/v1/graphql` |
| BTC_VAULTS_CACHE_MIN | The time to cache the BTC vaults data in minutes.                 | 1                                          |
| ORIGINS              | Comma-separated list of allowed origins. Globs are supported (1). | `http://localhos:3000`                     |
| PORT                 | The HTTP port the server listens for requests.                    | 3006                                       |
| REDIS_URL            | The URL of the Redis database.                                    | `redis://localhost:6379`                   |
| TVL_DATA_SAMPLE_ID   | The sample id within the TVL data.                                |                                            |
| TVL_DATA_URL         | The Databox URL that shall be used to get the TVL.                |                                            |
| TVL_REVALIDATE_MIN   | The time the TVL will be considered fresh.                        | 20                                         |

(1) Only stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.

## Token price cron

Periodically retrieves token prices from [CoinMarketCap](https://coinmarketcap.com/) and updates the key/value store (Redis).

### Configuration

These environment variables control how the `cron` job behaves:

| Variable                | Description                                                                         | Default                  |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| CACHE_EXPIRATION_MIN    | How long the prices will be kept in the cache.                                      | 3600                     |
| COIN_MARKET_CAP_API_KEY | The CoinMarketCap API key.                                                          |                          |
| COIN_MARKET_CAP_SLUGS   | String of comma separated token slugs. I.e. "bitcoin,ethereum"                      | bitcoin                  |
| REDIS_URL               | The URL of the Redis database.                                                      | `redis://localhost:6379` |
| REFRESH_PRICES_MIN      | How frequently the cache will be refreshed. If set to 0, it will run once and exit. | 5                        |

### Stored data

Price values in the `cache` are stored with keys prefixed with `price:`.
In addition, a `time` key is also stored every time the cache is refreshed.

## Vaults monitor cron

This service periodically checks the status of the bitcoin vaults used by the Hemi tunnel. It will send messages to Slack if any problem is found.

### Configuration

These environment variables control how the `cron` job behaves:

| Variable              | Description                                                                                 | Default                 |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| API_URL               | The URL of the API service.                                                                 | `http://localhost:3004` |
| MAX_BLOCKS_BEHIND     | The maximum difference between Bitcoin kit last header and the actual Bitcoin chain height. | 4                       |
| SLACK_MENTION         | The user to tag when sending alerts                                                         |                         |
| SLACK_WEBHOOK_URL     | The full URL of the webhook to send the alerts to.                                          |                         |
| VAULTS_MONITORING_MIN | How frequently the cache will be refreshed. If set to 0, it will run once and exit.         | 5                       |

## Local development and testing

Set the environment variables in `.env.local` and run:

```sh
docker compose build
docker compose --env-file .env.local up
```
