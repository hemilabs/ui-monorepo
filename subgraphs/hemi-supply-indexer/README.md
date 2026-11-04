# hemi-supply-indexer

A multichain [Envio HyperIndex](https://docs.envio.dev) indexer that takes the HEMI supply snapshots the portal-backend serves on `/circulating` and `/supply-history`. Unlike the subgraphs in this folder (which use The Graph), this indexer uses Envio so a single entity can be built from reads on several chains.

## What it indexes

A snapshot reads the HEMI balance of each non-circulating account, plus the total supply, on every chain HEMI is deployed to:

| Chain            | Accounts read                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Hemi (`43111`)   | Safe, veHEMI (locked), MerkleBox, Foundation Finance, Investor Allocation, ops addresses |
| Ethereum (`1`)   | total supply, Safe, the burn address, Investor Allocation, ops addresses                 |
| BNB Chain (`56`) | Safe, Investor Allocation, ops addresses                                                 |
| Base (`8453`)    | ops addresses                                                                            |

The accounts are declared as contracts in `config.yaml` with no events, so the handlers read their addresses from the generated config (`indexer.chains[chainId].Safe.addresses` and so on) instead of repeating them. The reads themselves are `onBlock` handlers (see `src/mappings/supplyHandlers.ts`): one daily, taken at the last block of each UTC day, and one realtime, every ~5 minutes. Both write the same `DailySupplySnapshot` entity, keyed by date (see `schema.graphql`).

## Prerequisites

- **Node** (version pinned in the repo `.nvmrc`) and **pnpm**.
- **Docker** installed and running — Envio runs a local Postgres + Hasura (GraphQL) in Docker. The CLI manages these containers itself; there is no `docker-compose.yml` to run by hand.
- Dependencies installed: `pnpm install` from the repo root.
- **An Envio API token** — required for HyperSync, which syncs Ethereum, BNB Chain and Base. Only Hemi syncs over an RPC.
  Get a free token at <https://envio.dev/app/api-tokens>, then `cp .env.example .env` and set `ENVIO_API_TOKEN` in `.env`.

## Snapshot env variables

These optional env variables configure the snapshots:

- `ENVIO_RPC_URL_BASE`, `ENVIO_RPC_URL_BNB`, `ENVIO_RPC_URL_ETH`, `ENVIO_RPC_URL_HEMI` — the RPC URLs used to read the balances on each chain. Join several URLs with `+` (for example `https://a.example+https://b.example`) to use them as viem fallbacks. The public RPCs can reject the historical reads, so set an archive URL on each chain.
- `ENVIO_SUPPLY_REALTIME_START_BLOCK_BASE`, `ENVIO_SUPPLY_REALTIME_START_BLOCK_BNB`, `ENVIO_SUPPLY_REALTIME_START_BLOCK_ETH`, `ENVIO_SUPPLY_REALTIME_START_BLOCK_HEMI` — the first block of the realtime snapshots (every ~5 minutes) on each chain. Set each one to a recent block before the chain head, so the historical sync does not go through the realtime stride. When unset, the realtime handler starts at the start block of the chain. The past days use the daily snapshots in both cases.

## Commands

Run these from this folder (`subgraphs/hemi-supply-indexer`):

```sh
pnpm dev -r    # run the indexer locally (codegen → Docker → migrate → index)
pnpm stop      # stop the local containers and delete the local database
pnpm codegen   # regenerate types from config.yaml + schema.graphql (no Docker)
pnpm test      # run the handler tests, in memory (no Docker, token or network)
```

Envio names the local Docker stack after the `name` in `config.yaml`, so `pnpm stop` only tears down a stack created under the current name.

Once it's up, explore the data at the GraphQL playground:

- Console: <http://localhost:8080> (default admin secret `testing`)
- Endpoint: `http://localhost:8080/v1/graphql`

## Deployment

Envio deploys the indexer on each merge to `main`, also when the indexer did not change. Envio keeps up to 3 live instances of the indexer, and each instance costs more indexing time. For this reason, deployments on merge to `main` are disabled by default. The goal is to keep only one live instance, the production instance, between deployments.

To deploy a change to the indexer:

1. In the [Envio project settings](https://envio.dev/app/hemilabs/hemi-supply-indexer), enable deployments on push to `main`.
2. Merge the change to `main`.
3. When Envio starts the new instance, disable deployments on push to `main` again.
4. Wait for the new instance to index again. The supply snapshots are RPC reads, per day and per chain, so this takes a while.
5. Promote the new instance to production.
6. Make sure that the new instance works correctly: `/circulating` and `/supply-history` should answer, and the portal-backend should point at the promoted instance (see its README for the env variable).
7. Remove the old instance.
