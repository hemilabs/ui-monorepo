# Portal Backend

The portal backend is composed by an API and several cron jobs.

## API

### Routes

#### `GET /btc-vaults/:chain-id`

Provides several metrics and status information about the BTC vaults in the given Hemi chain.

```console
$ curl http://localhost:3006/btc-vaults/743111
{"bitcoinChainData":{"bitcoin":{"height":901676},"bitcoinKit":{"height":901674,"blockHash":"0x0000000000000000000107cb02a6c19084b54a1d0e8504d3a96d8fdd10d2f62b","version":536944640,"previousBlockHash":"0x00000000000000000000a30d9d5025c11b17b2c44b176de0e284c84f59dacebb","merkleRoot":"0x05c2f62905f83beeb75131a245c1851705814d09165fdac50b74e0e4814607b2","timestamp":1750196887,"bits":386021892,"nonce":1816880925}},"tunnelManagerData":{"withdrawalsPaused":false},"vaultsData":[{"status":5,"vaultAddress":"0x3DA10b74Bd339E69C1De9408020ce640B012e8cc","balanceSats":0,"bitcoinCustodyAddress":"18AVmm853HVhibPHMc3JRLXMynzKAbj6Po","pendingWithdrawalAmountSat":0,"pendingWithdrawalCount":0},...]}
```

#### `GET /circulating`

Returns the HEMI circulating supply.

```console
$ curl http://localhost:3006/circulating
"555000000.000000000000000000"
```

#### `GET /claims/:chain-id/:address/all`

Returns an array with the data needed for a user to claim their HEMI tokens.

```console
$ curl http://localhost:3006/claims/43111/0x0000000000000000000000000000000000000001/all
[{"amount":"50000000000000000000","claimGroupId":16,"proof":["0x0000000000000000000000000000000000000000000000000000000000000001","0x0000000000000000000000000000000000000000000000000000000000000002","0x0000000000000000000000000000000000000000000000000000000000000003"]}]
```

The data for each claim group must be located in individual files in the `src/claims-data` folder. Data must be a object whose properties are the user addresses:

```json
{
  "0x0000000000000000000000000000000000000001": {
    "amount": "50000000000000000000",
    "claimGroupId": 16,
    "proof": [
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000000000000000000000000000003"
    ]
  }
}
```

Note that the route `GET /claims/:chain-id/:address` is kept for compatibility and will return just the first element of the array.

#### `GET /net-stats`

Returns the Hemi network stats required by the [home page of the Marketing site](https://hemi.xyz).

```console
$ curl http://localhost:3006/net-stats
{"btc-transactions":"7310797","latest-keystone":"2774674","timestamp":1759162804799}
```

#### `GET /prices`

Retrieves token prices (in USD) stored in a key/value store.

```console
$ curl http://localhost:3006/prices
{"prices":{"BTC":"94514.79193898945","M-BTC":"95894.52612269788","PUMPBTC":"95990.74415080296","WBTC":"95797.80677773379"},"time":"2025-02-17T23:12:35.803Z"}
```

#### `GET /tvl`

Computes and caches the TVL so the portal can have a value even if [Dune](https://dune.com/) is down or returns errors.

```console
$ curl http://localhost:3006/tvl
{"tvl":808500187.3738999}
```

#### `GET /ve-hemi-rewards/:chain-id`

Returns the veHemi rewards per unit of veHemi weight (voting power) for the next year (60 epochs of 6 days).

```console
$ curl http://localhost:3006/ve-hemi-rewards/43111
[0,0,0,0,0,0.001623267574410933,0.0013566087424163847,...other 50 elements,0,0,0]
```

#### Subgraph routes

The routes under the `/subgraphs` prefix proxy the subgraphs that index the data needed by the Tunnel and the Staking Campaign. Each route validates the `:chain-id` for its operation and returns `404 Not Found` on a mismatch. Most deposit/withdrawal queries run on the Ethereum chains (`1`, `11155111`) and the Hemi chains (`43111`, `743111`) respectively, but note two exceptions: BTC deposits (`/deposits/:hash/btc`) are queried on Hemi, and hashed-withdrawal proofs (`/hashedWithdrawals/:hash`) are queried on Ethereum. Addresses must match `0x[0-9a-fA-F]{40}`.

##### `GET /subgraphs/:chain-id/:operation/meta`

Returns the last block indexed by the tunnel subgraph for the given chain. `:operation` is `deposits` (Ethereum chains) or `withdrawals` (Hemi chains).

```console
$ curl http://localhost:3006/subgraphs/1/deposits/meta
{"number":25189339}
```

##### `GET /subgraphs/:chain-id/deposits/:address`

Returns the EVM deposits from an Ethereum chain into Hemi for the given address. Accepts the optional `fromBlock`, `limit` and `skip` query params.

```console
$ curl "http://localhost:3006/subgraphs/1/deposits/0x0000000000000000000000000000000000000001?limit=1"
{"deposits":[{"amount":"1000000000000000000","blockNumber":25189339,"direction":0,"from":"0x1234...","l1ChainId":1,"l1Token":"0x0000...","l2ChainId":43111,"l2Token":"0x0000...","timestamp":1759162804,"to":"0x1234...","transactionHash":"0xabc..."}]}
```

##### `GET /subgraphs/:chain-id/deposits/:hash/btc`

Returns the BTC deposit on Hemi identified by the given Bitcoin transaction id. Responds with `404 Not Found` if the deposit does not exist.

```console
$ curl http://localhost:3006/subgraphs/43111/deposits/<btc-tx-id>/btc
{"blockNumber":"1234","depositSats":"100000","depositTxId":"0x...","id":"...","netSatsAfterFee":"99000","recipient":"0x1234...","timestamp":"1759162804","transactionHash":"0xabc...","vault":"0x3DA1..."}
```

##### `GET /subgraphs/:chain-id/hashedWithdrawals/:hash`

Returns the prove and claim transaction hashes for the given hashed withdrawal. Runs on the Ethereum chains. Responds with `404 Not Found` if the withdrawal does not exist.

```console
$ curl http://localhost:3006/subgraphs/1/hashedWithdrawals/0x<hashed-withdrawal>
{"id":"0x...","claimTxHash":"0xabc...","proveTxHash":"0xdef..."}
```

##### `GET /subgraphs/:chain-id/withdrawals/:address/:type`

Returns the withdrawals from Hemi for the given address. `:type` is `btc` or `evm`. Accepts the optional `fromBlock`, `limit` and `skip` query params.

```console
$ curl "http://localhost:3006/subgraphs/43111/withdrawals/0x0000000000000000000000000000000000000001/evm?limit=1"
{"withdrawals":[{"amount":"1000000000000000000","blockNumber":4504196,"direction":1,"from":"0x1234...","l1ChainId":1,"l1Token":"0x0000...","l2ChainId":43111,"l2Token":"0x0000...","timestamp":1759162804,"to":"0x1234...","transactionHash":"0xabc..."}]}
```

##### `GET /subgraphs/:chain-id/staked`

Returns the total staked amount per account from the Stake subgraph.

```console
$ curl http://localhost:3006/subgraphs/43111/staked
{"staked":[{"totalStaked":"17616893499688152282458","id":"0x027a9d301FB747cd972CFB29A63f3BDA551DFc5c"},...]}
```

##### `GET /subgraphs/:chain-id/claim/:address/:claim-group`

Returns the Merkle claim data for the given address and numeric claim group. Responds with `404 Not Found` if there is no claim.

```console
$ curl http://localhost:3006/subgraphs/43111/claim/0x0000000000000000000000000000000000000001/0
{"account":"0x1234...","amount":"50000000000000000000","blockNumber":"1234","blockTimestamp":"1759162804","erc20":"0x0000...","lockupMonths":12,"ratio":15.23,"transactionHash":"0xabc..."}
```

##### `GET /subgraphs/:chain-id/locks/:address`

Returns the veHEMI locked positions owned (or previously owned) by the given address.

```console
$ curl http://localhost:3006/subgraphs/43111/locks/0x0000000000000000000000000000000000000001
{"positions":[]}
```

##### `GET /subgraphs/:chain-id/earn-requests/:address`

Returns the Hemi Earn cross-chain requests (deposits and redeems) initiated by the given address. Hemi mainnet only. Powered by the Envio multichain indexer (`hemi-earn-requests-subgraph`); rows are filtered by `initiator` (`msg.sender` on the Router call).

```console
$ curl http://localhost:3006/subgraphs/43111/earn-requests/0x0000000000000000000000000000000000000001
{"requests":[{"amountIn":"1000000000000000000","amountOut":"1000000000000000000","asset":"0x...","automatic":true,"claimableAt":"1759162804","claimTxHash":"0xabc...","failed":false,"failureReason":null,"kind":"DEPOSIT","receiver":"0x1234...","recoverTxHash":null,"requestedAt":"1759162804","requestId":"6","requestTxHash":"0xdef...","status":"FINALIZED"}]}
```

Requires the following env vars to be set on the backend:

- `SUBGRAPH_HEMI_EARN_REQUESTS_API_URL` — the full GraphQL URL of the Envio `hemi-earn-requests` indexer.
- `SUBGRAPH_HEMI_EARN_REQUESTS_API_KEY` — Bearer token for the Envio indexer (only sent when set; can be left empty against an unauthenticated local Envio).

### Configuration

These environment variables control how the cache works:

| Variable                 | Description                                                       | Default                            |
| ------------------------ | ----------------------------------------------------------------- | ---------------------------------- |
| BTC_VAULTS_CACHE_MIN     | The time to cache the BTC vaults data in minutes.                 | 1                                  |
| ORIGINS                  | Comma-separated list of allowed origins. Globs are supported (1). | `http://localhost:3000`            |
| PORT                     | The HTTP port the server listens for requests.                    | 3006                               |
| REDIS_URL                | The URL of the Redis database.                                    | `redis://localhost:6379`           |
| RPC_URL_HEMI             | URL of the Hemi RPC node.                                         | `https://rpc.hemi.network/rpc`     |
| SENTRY_DSN               | The Sentry DSN.                                                   |                                    |
| SENTRY_LOGGING_LEVELS    | The logging levels to send to Sentry (props of console.log).      | ["log", "warn", "error"]           |
| SUBGRAPH_API_KEY         | The API key needed to query the subgraphs.                        |                                    |
| SUBGRAPH_API_URL         | The base URL of the subgraphs gateway.                            | `https://gateway.thegraph.com/api` |
| SUBGRAPH_ORIGIN          | The `Origin` header sent when querying the subgraphs.             | `https://app.hemi.xyz`             |
| SUBGRAPH_VE_HEMI_TESTNET | Override for the published testnet veHEMI subgraph id.            |                                    |
| TVL_DUNE_API_KEY         | The Dune API key.                                                 |                                    |
| TVL_DUNE_QUERY_ID        | The Dune TVL query id.                                            |                                    |
| TVL_REVALIDATE_MIN       | The time the TVL will be considered fresh.                        | 720                                |

(1) Only stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.

## Hemi supply cron

Periodically retrieves network data to compute the HEMI circulating supply and updates the cache (Redis).
The main goal is to provide this information to CoinMarketCap.

### Configuration

These environment variables control how the `cron` job behaves:

| Variable              | Description                                                                          | Default                        |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| REDIS_URL             | The URL of the Redis database.                                                       | `redis://localhost:6379`       |
| REFRESH_SUPPLY_MIN    | How frequently the cache will be refreshed. If set to 0, it will run once and exit.  | 5                              |
| RPC_URL_BNB           | URL of the BNB Chain RPC node.                                                       | `https://56.rpc.thirdweb.com`  |
| RPC_URL_ETH           | URL of the Ethereum RPC node.                                                        | `https://eth.merkle.io`        |
| RPC_URL_HEMI          | URL of the Hemi RPC node.                                                            | `https://rpc.hemi.network/rpc` |
| SENTRY_DSN            | The Sentry DSN.                                                                      |                                |
| SENTRY_LOGGING_LEVELS | The logging levels to send to Sentry (props of console.log).                         | ["log", "warn", "error"]       |
| SUPPLY_CORRECTION     | Amount of HEMI to be subtracted from the supply. In wei/units, not in HEMI!          | 0                              |
| SUPPLY_MERKLE_LOCKED  | Percent of HEMI held in MerkleBox that are considered locked.                        | 50                             |
| SUPPLY_OP_ADDRESSES   | Comma-separated list of addresses, whose balances will be subtracted from the supply |                                |

### Stored data

Data in the `cache` is stored with keys prefixed with `supply:`.
In addition, a `supply:time` key is also stored every time the cache is refreshed.

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
| SENTRY_DSN              | The Sentry DSN.                                                                     |                          |
| SENTRY_LOGGING_LEVELS   | The logging levels to send to Sentry (props of console.log).                        | ["log", "warn", "error"] |

### Stored data

Price values in the `cache` are stored with keys prefixed with `price:`.
In addition, a `time` key is also stored every time the cache is refreshed.

## Vaults monitor cron

This service periodically checks the status of the bitcoin vaults used by the Hemi tunnel. It will send messages to Slack if any problem is found.

### Configuration

These environment variables control how the `cron` job behaves:

| Variable              | Description                                                                                 | Default                  |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| API_URL               | The URL of the API service.                                                                 | `http://localhost:3004`  |
| MAX_BLOCKS_BEHIND     | The maximum difference between Bitcoin kit last header and the actual Bitcoin chain height. | 4                        |
| SENTRY_DSN            | The Sentry DSN.                                                                             |                          |
| SENTRY_LOGGING_LEVELS | The logging levels to send to Sentry (props of console.log).                                | ["log", "warn", "error"] |
| SLACK_MENTION         | The user to tag when sending alerts                                                         |                          |
| SLACK_WEBHOOK_URL     | The full URL of the webhook to send the alerts to.                                          |                          |
| VAULTS_MONITORING_MIN | How frequently the cache will be refreshed. If set to 0, it will run once and exit.         | 5                        |

## Local development and testing

Set the environment variables in `.env.local` and run:

```sh
docker compose build
docker compose --env-file .env.local up
```
