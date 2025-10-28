# Subgraph API

This service provides access to the different subgraphs that index information needed by the Tunnel and the Staking Campaign.

## Configuration

These environment variables control how the API works:

| Variable         | Description                                                     | Default                |
| ---------------- | --------------------------------------------------------------- | ---------------------- |
| ORIGIN_LIST      | Comma-separated list of allowed origins. '\*' is not supported. | `http://localhos:3000` |
| PORT             | The HTTP port the server listens for requests.                  | 3003                   |
| SUBGRAPH_API_KEY | The API key needed to query the subgraphs.                      | -                      |
| SUBGRAPH_ORIGIN  | The "origin" allowed by the subgraph API.                       | `https://app.hemi.xyz` |

## Supported routes

- `GET /:chainId/(deposits|withdrawals)/meta`
- `GET /:chainId/deposits/:address`
- `GET /:chainId/withdrawals/:address/(btc|evm)`
- `GET /:chainId/staked`
- `GET /:chainId/claim/:address/:claimGroup`

## Local development and testing

To start the service, the environment variables are stored in a `.env` file and run the following commands:

```sh
docker build --tag subgraph-api:local .
docker run --env-file .env --init --interactive --publish 3003:3003 --rm --tty subgraph-api:local
```

To use a local graph-node and local subgraphs, set the following environment variables:

```env
SUBGRAPH_API_KEY= # No value
SUBGRAPH_API_URL=http://localhost:8000

# Local subgraph ids:
SUBGRAPH_VE_HEMI_TESTNET=subgraph_id
```
