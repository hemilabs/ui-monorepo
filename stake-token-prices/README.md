# Stake Token Price Service

This service periodically collects token prices (in USD) from CoinGecko or CoinMarketCap, stores those in a key/value store and exposes an HTTP endpoint to easily get the stored prices.

## Components

| Component | Description                                               |
| --------- | --------------------------------------------------------- |
| `cache`   | Redis database to store the token prices                  |
| `cron`    | Node cron job that pulls the prices and updates the cache |
| `api`     | Node HTTP server to retrieve the prices from the cache    |

This architecture allows making very few calls to the price APIs, scales well with the user's base and even allows the prices to be fed even if the pricing APIs are temporarily down.

### Configuration

These environment variables control how the `cron` job behaves:

| Variable                                     | Description                                                                         | Default               |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------- |
| CACHE_EXPIRATION_SEC                         | How long the prices will be kept in the cache.                                      | 3600                  |
| REFRESH_INTERVAL_SEC                         | How frequently the cache will be refreshed. If set to 0, it will run once and exit. | 300                   |
| COIN_MARKET_CAP_API_KEY / COIN_GECKO_API_KEY | The price API keys. One must be set. CoinMarketCap has precedence.                  |                       |
| REDIS_URL                                    | The URL of the Redis database.                                                      | http://localhost:6379 |

These control the `api` server:

| Variable  | Description                                    | Default               |
| --------- | ---------------------------------------------- | --------------------- |
| PORT      | The HTTP port the server listens for requests. | 3000                  |
| REDIS_URL | The URL of the Redis database.                 | http://localhost:6379 |

### Stored data

Price values in the `cache` are stored with keys prefixed with `price:`.
In addition, a `time` key is also stored every time the cache is refreshed.

## Local development and testing

To start all the services, run:

```sh
COIN_GECKO_API_KEY=MY_API_KEY docker compose up -d
```

Alternatively, if the environment variable are stored in a `.env.local` file, run:

```sh
docker compose --env-file=.env.local up
```

Then the prices can be obtained as follows:

```console
$ curl http://localhost:3000
{"prices":{"bitcoin":"97324","lorenzo-stbtc":"97334","merlin-s-seal-btc":"94216","pumpbtc":"97175","wrapped-bitcoin":"96443"},"time":"2025-02-14T21:05:36.599Z"}
```
