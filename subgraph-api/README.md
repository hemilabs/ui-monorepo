# Subgraph API

This service provides access to the different subgraphs that index information needed by the Tunnel and the Staking Campaign.

## Configuration

These environment variables control how the API works:

| Variable    | Description                                                     | Default                |
| ----------- | --------------------------------------------------------------- | ---------------------- |
| ORIGIN_LIST | Comma-separated list of allowed origins. '\*' is not supported. | `http://localhos:3000` |
| PORT        | The HTTP port the server listens for requests.                  | 3003                   |

## Supported routes

- `GET /:chainId/(deposits|withdrawals)/meta`
- `GET /:chainId/deposits/:address`
- `GET /:chainId/withdrawals/:address/(btc|evm)`
- `GET /:chainId/staked`

## Local development and testing

To start the service, the environment variables are stored in i.e. a `.env` file and run the following commands:

```sh
docker build --tag subgraph-api:local .
docker run --env-file .env --init --interactive --publish 3003:3003 --rm --tty subgraph-api:local
```
