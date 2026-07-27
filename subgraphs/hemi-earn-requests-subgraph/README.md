# hemi-earn-requests-subgraph

A multichain [Envio HyperIndex](https://docs.envio.dev) indexer for the Hemi Earn **cross-chain request** flow. Unlike the other subgraphs in this folder (which use The Graph), this one uses Envio so a single entity can be indexed across two chains.

## What it indexes

A deposit/redeem is a request that spans two contracts on two chains:

| Chain          | Contract | Role                                                           |
| -------------- | -------- | -------------------------------------------------------------- |
| Hemi (`43111`) | `Router` | Mints the `requestId`, emits `*Requested`, tracks lifecycle.   |
| Ethereum (`1`) | `Agent`  | Stakes/unstakes remotely, emits `*Processed` with the amounts. |

Every event carries the same `requestId`. That `requestId` is the `Request` entity id, so each event upserts the **same** entity — it is created as a partial view by whichever chain is indexed first and progressively filled in by later events from either chain (see `src/mappings/eventHandlers.ts`). Cross-chain ordering uses Envio's default
ordered multichain mode, and `status` is guarded so it never regresses.

The resulting `Request` entity (see `schema.graphql`) holds who/what (`initiator`, `receiver`, `asset`, `kind`), the amounts (`amountIn`, `amountOut`, and the pegged `stakedAmount` used as the earned-value cost basis), the lifecycle `status`, and per-milestone timestamps/tx hashes.

### `initiator` caveat

The Router's `*Requested` events do **not** emit `msg.sender`. The initiator is read
from the transaction (`event.transaction.from`, enabled via `field_selection` in
`config.yaml`). For a direct call this is the user's EOA; for a call routed through a
contract / smart-account wallet it is that contract's address, not the logical user.

## Data sources

- **Ethereum (Agent)**
- **Hemi (Router)**

## Prerequisites

- **Node** (version pinned in the repo `.nvmrc`) and **pnpm**.
- **Docker** installed and running — Envio runs a local Postgres + Hasura (GraphQL) in Docker. The CLI manages these containers itself; there is no `docker-compose.yml` to run by hand.
- Dependencies installed: `pnpm install` from the repo root.
- **An Envio API token** — required for HyperSync (the Ethereum / Agent side).
  Get a free token at <https://envio.dev/app/api-tokens>, then `cp .env.example .env` and set `ENVIO_API_TOKEN` in `.env`.

## Commands

Run these from this folder (`subgraphs/hemi-earn-requests-subgraph`):

```sh
pnpm dev -r    # run the indexer locally (codegen → Docker → migrate → index)
pnpm stop      # stop the local containers and delete the local database
pnpm codegen   # regenerate types from config.yaml + schema.graphql (no Docker)
```

Once it's up, explore the data at the GraphQL playground:

- Console: <http://localhost:8080> (default admin secret `testing`)
- Endpoint: `http://localhost:8080/v1/graphql`
