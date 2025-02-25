# Subgraphs

This document includes a list of common commands that should be used for all subgraphs. It the monorepo is already set up (deps are installed).

## Running Locally

There's a docker compose file in this folder. It spins up a [graph-node](https://github.com/graphprotocol/graph-node), a PostgreSQL instance, and a local IPFS instance.
A pair `chain:rpc_url` needs to be set to allow the subgraph to index the chain.
Use the following command to start the container.

```sh
# Example for sepolia
NETWORK_NAME="sepolia" ETHEREUM_RPC_URL="https://sepolia.drpc.org" docker-compose up -d
# Other env vars available to set
POSTGRES_USER=<postgres-user>
POSTGRESS_PASSWORD=<postgres-password>
```

Once the container is up, if it is the first time the subgraph is going to be run, it first needs to be created. For that, use (**Note that the following commands must be run in the appropriate subgraph folder**)

```sh
npm run create-local
```

In order to push the subgraph into the container, use

```sh
# deploys sepolia, if the container started is a sepolia one.
npm run deploy-local:sepolia
# deploys mainnet, if the container started is a mainnet one.
npm run deploy-local:mainnet
```

After deploying, the terminal will output the URL for querying the subgraph through HTTP requests.

## Deploying to Subgraph Studio

The following commands deploy a subgraph in [The Subgraph Studio](https://thegraph.com/studio/). This environment is intended for testing and staging. Note that subgraphs deployed there are archived after 45 days unless a newer version is published, so they are considered short term. Read their [archive policy](https://thegraph.com/docs/en/subgraphs/developing/deploying/multiple-networks/#subgraph-studio-subgraph-archive-policy).

[See the Subgraph Studio docs](https://thegraph.com/docs/en/subgraphs/developing/deploying/using-subgraph-studio/) for further info. Here's a quick summary:

First, an account in the Subgraph Studio needs to be created. Once there, a subgraph needs to be manually created. A subgraph in The Subgraph Studio needs to be created per subgraph/chain defined here in the code.

The subgraph naming convention should be `hemi-${package.json}.name-${chain}`. For example, in order to deploy the subgraph `tunnel-deposits-subgraph` in Sepolia, the subgraph `hemi-tunnel-deposits-subgraph-sepolia` must be created in the Subgraph Studio.

After created, a Deploy API Key is listed in the "Dashboard". Authorize the graph-cli by running

```sh
npm run graph:auth <API_KEY>
```

Once authorized, deploy the subgraph by running

```sh
# deploy sepolia in The Subgraph Studio
npm run deploy-studio:sepolia
# deploy mainnet in The Subgraph Studio
npm run deploy-studio:mainnet
```

Note that the version label of the deployment is read from the `package.json` file, so if it is not updated, the deploy will fail. Either update the `package.json` version, or remove the subgraph and re-create it.

Once deployed, the URL for querying the subgraph will be logged in the terminal. It should look like `https://api.studio.thegraph.com/query/{user-id}/{subgraph-name}/{version}`. If needed, the endpoint can be retrieved from the Dashboard.
