# Hemi Earn — Local sandbox

Scripts to spin up and configure a local Hemi Earn sandbox against an Anvil fork of Hemi mainnet. Lets any contributor run the Hemi Earn UI end-to-end without external tooling.

## Prerequisites

- Node 24 (matches the repo `.nvmrc`) — required for native `.ts`.
- A test EOA — used to receive funded ETH and tokens.

Foundry (`anvil`) is auto-installed by [`@hemilabs/anvil-fork-setup`](https://www.npmjs.com/package/@hemilabs/anvil-fork-setup) on first run if it's not already on your `PATH`.

## Quick start

From the repo root:

```bash
pnpm --filter portal sandbox:hemi-earn -- setup --address 0xYourEOA
```

That single command starts an Anvil fork of Hemi mainnet on port 8545, deploys the required mocks, funds the test account, and enables cooldown. Anvil is detached (`child.unref()` inside `@hemilabs/anvil-fork-setup`), so it keeps running after the script exits and the portal can talk to it.

The `--` before the subcommand is required — otherwise pnpm intercepts flags like `--address` as its own options.

The setup script prints the deployed addresses at the end. The Vetro-aliased mocks (`vetBTC`, `Gateway`, `Staking`) live at their production addresses via `anvil_setCode`; the sandbox `Router`, `Agent`, `hemiBTC`, `WBTC`, and `cbBTC` are freshly deployed with deterministic addresses.

### Bring your own Anvil

If you already have Anvil running (say, from a separate workflow), point the setup at it and skip the auto-start:

```bash
pnpm --filter portal sandbox:hemi-earn -- setup \
  --address 0xYourEOA \
  --fork-url http://127.0.0.1:8547
```

### Custom port or upstream RPC

```bash
pnpm --filter portal sandbox:hemi-earn -- setup \
  --address 0xYourEOA \
  --port 8547 \
  --upstream-rpc https://your-hemi-rpc.example.com
```

## Subcommands

All sandbox actions are dispatched through a single pnpm script that forwards its first positional token to the matching handler:

```bash
pnpm --filter portal sandbox:hemi-earn -- <subcommand> [flags]
```

| Subcommand | Purpose                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `setup`    | Start Anvil + deploy mocks + fund the test account.                                                   |
| `mining`   | Toggle Anvil's interval mining at runtime (see [Slow mining](#slow-mining)).                          |
| `relayer`  | Emulate the production keeper: claim mature cooldown redeems automatically (see [Relayer](#relayer)). |

Building blocks used by `setup` (`deployMocks.ts`, `fundAccount.ts`) are still invocable directly for advanced cases:

```bash
node portal/scripts/hemi-earn/deployMocks.ts [flags]
node portal/scripts/hemi-earn/fundAccount.ts [flags]
```

### Common flags

Flags are parsed by the handler of each subcommand.

- `setup` — `--address` / `-a` (required), `--port` / `-p` (default `8545`), `--upstream-rpc` / `-u` (default `https://rpc.hemi.network/rpc`), `--fork-url` / `-f` (skips auto-start), `--deployer-pk` (default is Anvil's well-known account #0).
- `mining` — `--seconds` / `-s` (default `6`, `0` returns to instant mining), `--fork-url` / `-f` (default `http://127.0.0.1:8545`).
- `relayer` — `--router` / `-r` (required), `--agent` / `-a` (required) — both come from the address banner `setup` prints; `--fork-url` / `-f`, `--deployer-pk`, `--poll` (seconds between ticks, default `1`), `--from-block N` (first block to backfill from, default `0` — full history), `--disable-autoclaim` (observe events but skip the claim; simulates a downed keeper).

## Cooldown

The setup script enables cooldown on the staking vault with a 1-day duration, exercising the 2-step withdraw flow (request + claim after cooldown) by default. The claim step is dispatched by the production keeper; locally, run the [`relayer`](#relayer) subcommand alongside the portal to reproduce that behavior.

## Slow mining

Slow-block mining is useful for reproducing intermediate UI states (pending tx spinners, cross-chain step indicators) without racing against Anvil's default instant mining. The `mining` subcommand toggles Anvil's `anvil_setIntervalMining` at runtime — on-chain state and Envio indexing are preserved, no restart needed.

```bash
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 6   # a block every 6s
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 3   # a block every 3s
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 0   # back to instant
```

## Relayer

The production Hemi Earn keeper watches the Agent for `UnstakeRequested` events and calls `claimUnstake(requestId)` once the on-chain `claimableAt` matures. Without it, redeems that fall on the cooldown branch stall at `COOLDOWN_MATURE` and the portal's step 2 never fires. The `relayer` subcommand ports that keeper for the local sandbox.

It's a **foreground daemon** — run it in its own terminal alongside the portal and stop it with `Ctrl+C`. Uses the on-chain block timestamp (not `Date.now()`) so `evm_increaseTime` in tests takes effect on the maturity check.

`--router` and `--agent` are required — copy them from the address banner `setup` prints. This avoids silent drift if the deploy sequence in `deployMocks.ts` ever changes.

By default the relayer backfills from block 0, so unstake requests emitted **before** you started it are still picked up and claimed. Pass `--from-block N` to skip earlier history (rarely useful on a fresh sandbox, but handy if the anvil fork has a lot of pre-existing state).

```bash
# Default poll (1s), watching the Router/Agent that setup printed
pnpm --filter portal sandbox:hemi-earn -- relayer \
  --router 0x8a791620dd6260079bf849dc5567adc3f2fdc318 \
  --agent 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6

# Point at a different fork URL
pnpm --filter portal sandbox:hemi-earn -- relayer \
  --router 0x... --agent 0x... \
  --fork-url http://127.0.0.1:8547

# Observe UnstakeRequested but skip the claim — exercises the portal's
# "Claim from vault" manual escape-hatch CTA (simulates keeper offline).
pnpm --filter portal sandbox:hemi-earn -- relayer \
  --router 0x... --agent 0x... \
  --disable-autoclaim
```

## Mock contracts

`contracts/` holds the Solidity sources of the mocks used by the sandbox; `artifacts/` holds their pre-compiled JSON (bytecode + ABI). See [`contracts/README.md`](./contracts/README.md) for what each mock does and how to refresh them when they change upstream.

## Why the nested `package.json`

`portal/package.json` doesn't set `"type": "module"` (Next.js needs the default CJS resolution). The nested `package.json` in this folder scopes ESM to these scripts only, so Node can execute the `.ts` files with `import`/`export` syntax without touching the rest of `portal/`.
