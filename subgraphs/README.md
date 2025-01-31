# Subgraphs

This Readme includes a list of common commands that should be used for all subgraphs. This documentation assumes the monorepo is already setup (deps are installed).

## Running Locally

There's a docker compose file in this folder. It spins up a graph node, a postgresql instance, and a local IPFS instance.  
A pair `chain:rpc_url` needs to be set as an environment variable - this RPC will be used to index the chain.
Use the following command to start the container.

```sh
# Example for sepolia
CHAIN_RPC="sepolia:https://sepolia.drpc.org" docker-compose up -d
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

## Deploying to Subgraph studio

The following commands are to deploy a subgraph in [the graph studio](https://thegraph.com/studio/). This environment is intended for testing and staging. Note that subgraphs deployed here are archived after 45 days if a newer version isn't published, so they are considered short term. [Further info](https://thegraph.com/docs/en/subgraphs/developing/deploying/multiple-networks/#subgraph-studio-subgraph-archive-policy).

[See Graph studio docs](https://thegraph.com/docs/en/subgraphs/developing/deploying/using-subgraph-studio/) for further info. Here's a quick summary:

First, an account in the graph studio needs to be created. Once there, a subgraph needs to be manually created. A subgraph in The Graph Studio needs to be created per subgraph/chain defined here in the code.

The subgraph naming convention should be

`${package.json}.name-${chain}`. For example, in order to deploy the subgraph `tunnel-deposits-subgraph` in Sepolia, the subgraph `tunnel-deposits-subgraph-sepolia` must be created in the Graph Studio.

After created, a Deploy API Key is listed in the "Dashboard". Authorize the graph-cli by running

```sh
npm run graph:auth <API_KEY>
```

Once authorized, deploy the subgraph by running

```sh
# deploy sepolia in The Graph Studio
npm run deploy-studio:sepolia
# deploy mainnet in The Graph Studio
npm run deploy-studio:mainnet
```

Note that the version label of the deployment is read from the `package.json` file, so if it is not updated, the deploy will fail. Either update the `package.json` version, or remove the subgraph and re-create it.

Once deployed, the URL for querying the subgraph will be logged in the terminal. It should look like `https://api.studio.thegraph.com/query/{user-id}/{subgraph-name}/{version}`
