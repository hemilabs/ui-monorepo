# Hemi Earn — Local sandbox

Scripts to spin up and configure a local Hemi Earn sandbox against an Anvil fork of Hemi mainnet. Lets any contributor run the Hemi Earn UI end-to-end without external tooling.

## Prerequisites

- Node 24 (matches the repo `.nvmrc`) — required for native `.ts` execution via `--experimental-transform-types`.
- [Foundry](https://book.getfoundry.sh/getting-started/installation) for the `anvil` binary.
- A JSON-RPC URL for Hemi mainnet (e.g. `https://rpc.hemi.network/rpc`).
- A test EOA — used to receive funded ETH and tokens.

## Quick start

Run both commands from the repo root:

```bash
# Terminal 1 — fork Hemi mainnet
anvil --fork-url https://rpc.hemi.network/rpc

# Terminal 2 — deploy mocks + fund the test account
pnpm --filter hemi-earn-sandbox-scripts run setup -- --address 0xYourEOA
```

The `--` before the script flags is required — otherwise pnpm intercepts `--address` as its own option. The invocation works from any folder in the repo (pnpm walks up to the workspace root), but the repo root is the natural place to keep things consistent.

The setup script prints the deployed addresses at the end. The Vetro-aliased mocks (`vetBTC`, `Gateway`, `Staking`) live at their production addresses via `anvil_setCode`; the sandbox `Router`, `Agent`, `hemiBTC`, `WBTC`, and `cbBTC` are freshly deployed with deterministic addresses.

### Running on a custom port

If `8545` is already in use, start Anvil on a different port and forward it to the setup script:

```bash
anvil --port 8547 --fork-url https://rpc.hemi.network/rpc

pnpm --filter hemi-earn-sandbox-scripts run setup -- \
  --address 0xYourEOA \
  --fork-url http://127.0.0.1:8547
```

## Available scripts

Each script is a standalone `.ts` module that exports its main function and can also be run as a CLI. Run them from anywhere via:

```bash
node --experimental-transform-types portal/scripts/hemi-earn/<script>.ts [flags]
```

| Script           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `setup.ts`       | Deploy mocks + fund the test account. One-shot entry point.      |
| `deployMocks.ts` | Deploy mocks only. No funding.                                   |
| `fundAccount.ts` | Fund an EOA with ETH + tokens. Requires deployed mock addresses. |

### Common flags

- `--fork-url` / `-f`: RPC URL of the running Anvil (default `http://127.0.0.1:8545`).
- `--deployer-pk`: private key used to sign deploy/write txs (default is Anvil's well-known account #0).

## Cooldown

The setup script enables cooldown on the staking vault with a 1-day duration, exercising the 2-step withdraw flow (request + claim after cooldown) by default.

## Why the nested `package.json`

`portal/package.json` doesn't set `"type": "module"` (Next.js needs the default CJS resolution). The nested `package.json` in this folder scopes ESM to these scripts only, so Node can execute the `.ts` files with `import`/`export` syntax via `--experimental-transform-types` without touching the rest of `portal/`.
