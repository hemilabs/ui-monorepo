# Hemi Earn — Local sandbox

Scripts to spin up and configure a local Hemi Earn sandbox against an Anvil fork of Hemi mainnet. Lets any contributor run the Hemi Earn UI end-to-end without external tooling.

## Prerequisites

- Node 24 (matches the repo `.nvmrc`) — required for native `.ts` execution via `--experimental-transform-types`.
- A test EOA — used to receive funded ETH and tokens.

Foundry (`anvil`) is auto-installed by [`@hemilabs/anvil-fork-setup`](https://www.npmjs.com/package/@hemilabs/anvil-fork-setup) on first run if it's not already on your `PATH`.

## Quick start

From the repo root:

```bash
pnpm --filter hemi-earn-sandbox-scripts run setup -- --address 0xYourEOA
```

That single command starts an Anvil fork of Hemi mainnet on port 8545, deploys the required mocks, funds the test account, and enables cooldown. Anvil is detached (`child.unref()` inside `@hemilabs/anvil-fork-setup`), so it keeps running after the script exits and the portal can talk to it.

The `--` before the script flags is required — otherwise pnpm intercepts `--address` as its own option.

The setup script prints the deployed addresses at the end. The Vetro-aliased mocks (`vetBTC`, `Gateway`, `Staking`) live at their production addresses via `anvil_setCode`; the sandbox `Router`, `Agent`, `hemiBTC`, `WBTC`, and `cbBTC` are freshly deployed with deterministic addresses.

### Bring your own Anvil

If you already have Anvil running (say, from a separate workflow), point the setup at it and skip the auto-start:

```bash
pnpm --filter hemi-earn-sandbox-scripts run setup -- \
  --address 0xYourEOA \
  --fork-url http://127.0.0.1:8547
```

### Custom port or upstream RPC

```bash
pnpm --filter hemi-earn-sandbox-scripts run setup -- \
  --address 0xYourEOA \
  --port 8547 \
  --upstream-rpc https://your-hemi-rpc.example.com
```

## Available scripts

Each script is a standalone `.ts` module that exports its main function and can also be run as a CLI. Run them from anywhere via:

```bash
node --experimental-transform-types portal/scripts/hemi-earn/<script>.ts [flags]
```

| Script           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `setup.ts`       | Start Anvil + deploy mocks + fund the test account.              |
| `deployMocks.ts` | Deploy mocks only. Requires a running Anvil.                     |
| `fundAccount.ts` | Fund an EOA with ETH + tokens. Requires deployed mock addresses. |

### Common flags

- `--address` / `-a`: the test EOA to fund (required for `setup.ts`).
- `--port` / `-p`: local port for the Anvil fork (default `8545`).
- `--upstream-rpc` / `-u`: RPC to fork from (default `https://rpc.hemi.network/rpc`).
- `--fork-url` / `-f`: URL of an already-running Anvil; when set, skips the auto-start.
- `--deployer-pk`: private key used to sign deploy/write txs (default is Anvil's well-known account #0, re-exported from `@hemilabs/anvil-fork-setup/utils`).

## Cooldown

The setup script enables cooldown on the staking vault with a 1-day duration, exercising the 2-step withdraw flow (request + claim after cooldown) by default.

## Why the nested `package.json`

`portal/package.json` doesn't set `"type": "module"` (Next.js needs the default CJS resolution). The nested `package.json` in this folder scopes ESM to these scripts only, so Node can execute the `.ts` files with `import`/`export` syntax via `--experimental-transform-types` without touching the rest of `portal/`.
