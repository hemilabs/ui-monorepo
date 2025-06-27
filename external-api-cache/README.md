# External API Cache

This service is a middleman between the Portal and external APIs, caching the responses and using a SWR approach to allow the Portal still have data even when the APIs return errors or are down.

## Configuration

These environment variables control how the cache works:

| Variable           | Description                                                     | Default                 |
| ------------------ | --------------------------------------------------------------- | ----------------------- |
| ORIGINS            | Comma-separated list of allowed origins. '\*' is not supported. | `http://localhost:3000` |
| PORT               | The HTTP port the server listens for requests.                  | 3005                    |
| TVL_DATA_SAMPLE_ID | The sample id within the TVL data.                              |                         |
| TVL_DATA_URL       | The Databox URL that shall be used to get the TVL.              |                         |
| TVL_REVALIDATE_MIN | The time the TVL will be considered fresh.                      | 20                      |

## Local development and testing

Set the environment variables in `.env.local` and run:

```sh
env $(cat .env.local | xargs) npm start
```

To build the Docker image and start the service:

```sh
docker build --tag external-api.cache:local .
docker run --env-file .env.local --init --interactive --publish 3005:3005 --rm --tty external-api.cache:local
```

Query example:

```console
$ curl http://localhost:3005/tvl
{"tvl":808500187.3738999}
```
