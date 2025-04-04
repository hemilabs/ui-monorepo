# Hemi Points API

This service provides the amount of Hemi points any user has earned through the **Incentivized Testnet**, **Hemi Staking** campaigns, etc.
Data is provided by [Absinthe](https://absinthe.network/).

## Configuration

These environment variables control how the API works:

| Variable         | Description                                                     | Default                                    |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------ |
| ABSINTHE_API_KEY | The JWT used to authenticate to the Absinthe GraphQL API.       |                                            |
| ABSINTHE_API_URL | The Absinthe GraphQL API URL.                                   | `https://gql3.absinthe.network/v1/graphql` |
| ORIGINS          | Comma-separated list of allowed origins. '\*' is not supported. | `http://localhos:3000`                     |
| PORT             | The HTTP port the server listens for requests.                  | 3002                                       |

## Local development and testing

To start the service, the environment variables are stored in i.e. a `.env.local` file and run the following commands:

```sh
docker build --tag staking-points-api:local .
docker run --env-file .env.local --init --interactive --publish 3002:3002 --rm --tty staking-points-api:local
```

Then the points for a user can be obtained as follows:

```console
$ curl http://localhost:3002/0x85e0D9e73c12eFE889750f44422a77B544D48d17
{"points":270644}
```
