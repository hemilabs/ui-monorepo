# Token Price Service

This service periodically collects token prices (in USD) from CoinMarketCap, stores those in a key/value store and exposes an HTTP endpoint to easily get the stored prices.

## Components

| Component | Description                                               |
| --------- | --------------------------------------------------------- |
| `cache`   | Redis database to store the token prices                  |
| `cron`    | Node cron job that pulls the prices and updates the cache |
| `api`     | Node HTTP server to retrieve the prices from the cache    |

This architecture allows making very few calls to the price APIs, scales well with the user's base and even allows the prices to be fed even if the pricing APIs are temporarily down.

### Configuration

These environment variables control how the `cron` job behaves:

| Variable                | Description                                                                         | Default                 |
| ----------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| CACHE_EXPIRATION_SEC    | How long the prices will be kept in the cache.                                      | 3600                    |
| REFRESH_INTERVAL_SEC    | How frequently the cache will be refreshed. If set to 0, it will run once and exit. | 300                     |
| COIN_MARKET_CAP_API_KEY | The CoinMarketCap API key.                                                          |                         |
| COIN_MARKET_CAP_SLUGS   | String of comma separated token slugs. I.e. "bitcoin,ethereum"                      | bitcoin                 |
| REDIS_URL               | The URL of the Redis database.                                                      | `http://localhost:6379` |

These control the `api` server:

| Variable  | Description                                                     | Default                 |
| --------- | --------------------------------------------------------------- | ----------------------- |
| ORIGINS   | Comma-separated list of allowed origins. '\*' is not supported. | `http://localhos:3001`  |
| PORT      | The HTTP port the server listens for requests.                  | 3001                    |
| REDIS_URL | The URL of the Redis database.                                  | `http://localhost:6379` |

### Stored data

Price values in the `cache` are stored with keys prefixed with `price:`.
In addition, a `time` key is also stored every time the cache is refreshed.

## Local development and testing

To start all the services, run:

```sh
COIN_MARKET_CAP_API_KEY=MY_API_KEY docker compose up -d
```

Alternatively, if the environment variables are stored in a `.env.local` file, run:

```sh
docker compose --env-file=.env.local up
```

Then the prices can be obtained as follows:

```console
$ curl http://localhost:3000
{"prices":{"BTC":"94514.79193898945","M-BTC":"95894.52612269788","PUMPBTC":"95990.74415080296","WBTC":"95797.80677773379"},"time":"2025-02-17T23:12:35.803Z"}
```
