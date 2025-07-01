# Vaults Monitor Service

This service periodically checks the status of the bitcoin vaults used by the Hemi tunnel. It will send messages to Slack if any problem is found.

## Components

| Component | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `api`     | Node HTTP server to retrieve the status of the vaults.       |
| `cron`    | Node cron job that analyzes the status and emits the alerts. |

### Configuration

These control the `api` server:

| Variable      | Description                                                       | Default                |
| ------------- | ----------------------------------------------------------------- | ---------------------- |
| CACHE_MINUTES | The time to cache the status in minutes.                          | 1                      |
| CHAIN         | The Hemi chain to monitor: mainnet or testnet.                    | mainnet                |
| ORIGINS       | Comma-separated list of allowed origins. Globs are supported (1). | `http://localhos:3000` |
| PORT          | The HTTP port the server listens for requests.                    | 3004                   |

(1) Only stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.

These environment variables control how the `cron` job behaves:

| Variable             | Description                                                                                 | Default                 |
| -------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| API_URL              | The URL of the API service.                                                                 | `http://localhost:3004` |
| MAX_BLOCKS_BEHIND    | The maximum difference between Bitcoin kit last header and the actual Bitcoin chain height. | 4                       |
| REFRESH_INTERVAL_SEC | How frequently the cache will be refreshed. If set to 0, it will run once and exit.         | 300                     |
| SLACK_MENTION        | The user to tag when sending alerts                                                         |                         |
| SLACK_WEBHOOK_URL    | The full URL of the webhook to send the alerts to.                                          |                         |

## Local development and testing

To start all the services, run:

```sh
docker compose up -d
```

Note: Environment variables can also be set in a `.env` file

Querying the API is straightforward (response was edited):

```console
$ curl http://localhost:3004
{"bitcoinChainData":{"bitcoin":{"height":901676},"bitcoinKit":{"height":901674,"blockHash":"0x0000000000000000000107cb02a6c19084b54a1d0e8504d3a96d8fdd10d2f62b","version":536944640,"previousBlockHash":"0x00000000000000000000a30d9d5025c11b17b2c44b176de0e284c84f59dacebb","merkleRoot":"0x05c2f62905f83beeb75131a245c1851705814d09165fdac50b74e0e4814607b2","timestamp":1750196887,"bits":386021892,"nonce":1816880925}},"tunnelManagerData":{"withdrawalsPaused":false},"vaultsData":[{"status":5,"vaultAddress":"0x3DA10b74Bd339E69C1De9408020ce640B012e8cc","balanceSats":0,"bitcoinCustodyAddress":"18AVmm853HVhibPHMc3JRLXMynzKAbj6Po","pendingWithdrawalAmountSat":0,"pendingWithdrawalCount":0},...]}
```
