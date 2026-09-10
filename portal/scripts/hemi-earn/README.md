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

| Subcommand     | Purpose                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `setup`        | Start Anvil + deploy mocks + fund the test account.                                                                          |
| `mint`         | Mint from any ERC20-mock — top up an EOA or inject yield into the vault (see [Minting](#minting)).                           |
| `mining`       | Toggle Anvil's interval mining at runtime (see [Slow mining](#slow-mining)).                                                 |
| `relayer`      | Emulate the production keeper: claim mature cooldown redeems and bridge cancellation requests (see [Relayer](#relayer)).     |
| `fail-gateway` | Toggle `PreviewableGatewayMock` into a failure mode (see [Failure simulation](#failure-simulation)).                         |
| `keeper`       | Fire `Agent.cancel` / `Agent.retry` to simulate the "keeper wins the race" scenario (see [Keeper actions](#keeper-actions)). |

Building blocks used by `setup` (`deployMocks.ts`, `fundAccount.ts`) are still invocable directly for advanced cases:

```bash
node portal/scripts/hemi-earn/deployMocks.ts [flags]
node portal/scripts/hemi-earn/fundAccount.ts [flags]
```

### Common flags

Flags are parsed by the handler of each subcommand.

- `setup` — `--address` / `-a` (required), `--port` / `-p` (default `8545`), `--upstream-rpc` / `-u` (default `https://rpc.hemi.network/rpc`), `--fork-url` / `-f` (skips auto-start), `--deployer-pk` (default is Anvil's well-known account #0).
- `mint` — `--token` / `-t` (required), `--to` (required), `--amount` / `-n` (default `10`, parsed via `parseEther` — sandbox mocks are all 18-decimal by design, no `decimals()` lookup). Optional: `--fork-url` / `-f`, `--deployer-pk`.
- `mining` — `--seconds` / `-s` (default `6`, `0` returns to instant mining), `--fork-url` / `-f` (default `http://127.0.0.1:8545`).
- `relayer` — `--router` / `-r` (required), `--agent` / `-a` (required) — both come from the address banner `setup` prints; `--fork-url` / `-f`, `--deployer-pk`, `--poll` (seconds between ticks, default `1`), `--from-block N` (first block to backfill from, default `0` — full history), `--disable-autoclaim` (observe events but skip the claim; simulates a downed keeper).
- `fail-gateway` — either `--status` (read-only, prints the current state) or `--kind` / `-k` (`deposit` | `redeem`) + `--mode` / `-m` (`off` | `on` | `slippage` | `fee` | `unknown`). Optional: `--fork-url` / `-f`, `--deployer-pk`.
- `keeper` — `--action` (`cancel` | `retry`), `--agent` / `-a` (from the `setup` banner), `--request-id` / `-i` (uint256). Optional: `--value` (wei, used to top up `msg.value` under the mock's strict-fee mode), `--fork-url` / `-f`, `--deployer-pk`.

## Cooldown

The setup script enables cooldown on the staking vault with a 1-day duration, exercising the 2-step withdraw flow (request + claim after cooldown) by default. The claim step is dispatched by the production keeper; locally, run the [`relayer`](#relayer) subcommand alongside the portal to reproduce that behavior.

## Minting

Every sandbox token exposes the OpenZeppelin `mint(address,uint256)` shape, so a single subcommand covers both common flows:

- **Top up an EOA** — mint deposit assets to a wallet you're testing with. `setup` already funds the test account with 10 of each on init; use this to bump balances mid-session or fund a second wallet.
- **Inject yield** — mint the pegged token directly into the staking vault. That inflates `totalAssets()` without issuing new shares, so `convertToAssets(userShares)` grows proportionally and the portal's "Total earned" card starts showing profit.

```bash
# Top up an EOA with 5 hemiBTC (copy the token address from the setup banner)
pnpm --filter portal sandbox:hemi-earn -- mint \
  --token 0xYourHemiBTC \
  --to    0xYourEOA \
  --amount 5

# Inject 1 vetBTC of yield into the staking vault (Vetro-aliased addresses)
pnpm --filter portal sandbox:hemi-earn -- mint \
  --token 0xf196C68233464A16CFDa319a47c21f4cECa62001 \
  --to    0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e \
  --amount 1
```

## Slow mining

Slow-block mining is useful for reproducing intermediate UI states (pending tx spinners, cross-chain step indicators) without racing against Anvil's default instant mining. The `mining` subcommand toggles Anvil's `anvil_setIntervalMining` at runtime — on-chain state and Envio indexing are preserved, no restart needed.

```bash
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 6   # a block every 6s
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 3   # a block every 3s
pnpm --filter portal sandbox:hemi-earn -- mining --seconds 0   # back to instant
```

## Relayer

The production Hemi Earn keeper handles two flows that a local sandbox has no equivalent for:

1. **Cooldown auto-claim.** Watches the Agent for `UnstakeRequested` events and calls `claimUnstake(requestId)` once the on-chain `claimableAt` matures. Without it, redeems that fall on the cooldown branch stall at `COOLDOWN_MATURE` and the portal's step 2 never fires.
2. **Cancel bridge.** Watches the Router for `CancellationRequested` events (fired by the portal's Cancel CTA mid-cooldown) and immediately calls `Agent.cancel(requestId)` to bridge the intent cross-chain. One-shot per event: if the on-chain cancel reverts, the entry is dropped and the user re-triggers from the UI.

It's a **foreground daemon** — run it in its own terminal alongside the portal and stop it with `Ctrl+C`. Uses the on-chain block timestamp (not `Date.now()`) so `evm_increaseTime` in tests takes effect on the maturity check.

`--router` and `--agent` are required — copy them from the address banner `setup` prints. This avoids silent drift if the deploy sequence in `deployMocks.ts` ever changes.

By default the relayer backfills from block 0 for both event types, so unstake requests and cancellations emitted **before** you started it are still picked up. Pass `--from-block N` to skip earlier history (rarely useful on a fresh sandbox, but handy if the anvil fork has a lot of pre-existing state).

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

## Failure simulation

`PreviewableGatewayMock` (aliased at the Vetro gateway production address by `setup`) exposes revert-mode toggles that let a deposit or a redeem fail deterministically on the Agent side. Combined with the [`relayer`](#relayer) subcommand, this is what makes the REMOTE_FAILED UI (Retry / "Return share tokens" / cancel bridge CTAs) end-to-end testable locally without any external infra.

Each mode maps to a distinct revert shape that the portal's `failureReason` decoder classifies into a category, which in turn decides which CTAs render:

| `--mode`   | Revert shape                          | Portal category | CTAs shown                    |
| ---------- | ------------------------------------- | --------------- | ----------------------------- |
| `slippage` | `Error("insufficient output amount")` | `slippage`      | "Return share tokens" only    |
| `fee`      | `InsufficientFee(1e15, 5e14)`         | `gas`           | Retry + "Return share tokens" |
| `unknown`  | `Error("boom")`                       | `unknown`       | Retry + "Return share tokens" |
| `on`       | legacy bool `revert("...failed")`     | `unknown`       | Retry + "Return share tokens" |
| `off`      | clears both legacy bool and mode      | —               | request proceeds normally     |

```bash
# Read the current state without changing anything
pnpm --filter portal sandbox:hemi-earn -- fail-gateway --status

# Make the next redeem revert with a slippage-shaped error
pnpm --filter portal sandbox:hemi-earn -- fail-gateway --kind redeem --mode slippage

# Make the next deposit revert with an InsufficientFee custom error
pnpm --filter portal sandbox:hemi-earn -- fail-gateway --kind deposit --mode fee

# Reset both sides so operations succeed again
pnpm --filter portal sandbox:hemi-earn -- fail-gateway --kind deposit --mode off
pnpm --filter portal sandbox:hemi-earn -- fail-gateway --kind redeem --mode off
```

## Keeper actions

The production keeper can resolve a REMOTE_FAILED request (or a mid-cooldown redeem) before the user clicks the recovery CTA in the portal — the "keeper wins the race" path. When that happens on-chain, `Agent.failedRequests[id].tokenIn` (or `Agent.unstakeRequests[id].share`) goes to zero and the portal must hide its recovery CTAs on the next refetch. The `keeper` subcommand fires those Agent-side actions manually so that branch of the UI is testable end-to-end.

Two actions, one dispatch:

- `--action cancel` — pre-flight probes `failedRequests` then `unstakeRequests` (matches the production `Agent.cancel` order) and picks the branch automatically. Errors out with a diagnostic if the request is in neither map.
- `--action retry` — pre-flight requires the request to be in `failedRequests`; post-flight re-reads and reports whether the entry cleared (success) or is still populated (underlying failure still active — clear it via `fail-gateway --kind <deposit|redeem> --mode off` first).

Signer is the default anvil `#0`, which the sandbox `setup` registers as a keeper on the `ToggleableAgent`. `--agent` is required — copy it from the address banner `setup` prints.

```bash
# Cancel a stuck REMOTE_FAILED request (failed branch — after fail-gateway + submit)
pnpm --filter portal sandbox:hemi-earn -- keeper \
  --action cancel \
  --agent 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6 \
  --request-id 42

# Cancel a redeem mid-cooldown (unstake branch — before the relayer autoclaim fires)
pnpm --filter portal sandbox:hemi-earn -- keeper \
  --action cancel \
  --agent 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6 \
  --request-id 43

# Retry a REMOTE_FAILED redeem after clearing the failure mode
pnpm --filter portal sandbox:hemi-earn -- keeper \
  --action retry \
  --agent 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6 \
  --request-id 44
```

## Mock contracts

`contracts/` holds the Solidity sources of the mocks used by the sandbox; `artifacts/` holds their pre-compiled JSON (bytecode + ABI). See [`contracts/README.md`](./contracts/README.md) for what each mock does and how to refresh them when they change upstream.

## Why the nested `package.json`

It pins the Node floor these scripts need (`>=24`, which is what runs the `.ts` files directly) and keeps the folder a package boundary of its own. The `tsconfig.json` next to it does the same for typechecking: the portal excludes `scripts/hemi-earn/**/*`, so these files are checked against `@tsconfig/node24` instead of the app's browser config.
