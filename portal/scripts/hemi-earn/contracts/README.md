# Contracts — source of record for the sandbox mocks

These are the Solidity sources for the mock contracts whose compiled bytecode ships in `../artifacts/*.json`.

## Why they live here

The setup script (`../setup.ts`) deploys these mocks (or aliases them at Vetro production addresses via `anvil_setCode`) to reproduce the Hemi Earn end-to-end flow on a single Anvil fork. The artifacts alone are enough to make the sandbox work, but keeping the `.sol` next to them makes it obvious where the bytecode comes from and lets reviewers audit the behavior without hunting for a private repo.

## Refreshing after a change

Since compilation happens outside this repo, keep the `.sol` here in sync with whatever produced `../artifacts/*.json`. When a mock changes:

1. Rebuild upstream (`forge build`) and grab both the updated `.sol` and its `out/<Name>.sol/<Name>.json`.
2. Drop the `.sol` here.
3. Normalize the JSON to `{ abi, bytecode }` (drop `deployedBytecode`, `methodIdentifiers`, `rawMetadata`, `metadata` — keeps the diff small) and drop it into `../artifacts/`.
4. Land both in the same PR so bytecode and source never drift.

## Contract map

| Contract                            | Purpose                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LabeledERC20Mock.sol`              | ERC20 with `setLabel(name, symbol)` — used for hemiBTC / WBTC / cbBTC so on-chain metadata reads work post-PR#1996 (which removed the local `tokens.ts`). |
| `PeggedTokenMock.sol`               | Minimal `IPeggedToken` with a `setGateway` accessor — aliased at `VETBTC_PROD`.                                                                           |
| `PreviewableGatewayMock.sol`        | Gateway mock + `previewWithdraw(...)` — aliased at `GATEWAY_PROD`.                                                                                        |
| `CooldownAwareStakingVaultMock.sol` | ERC4626 + `IStakingVault` with cooldown tracking — aliased at `STAKING_PROD`. Setup enables cooldown with a 1-day duration by default.                    |
| `ToggleableRouter.sol`              | RouterMock + non-zero `_quote()` so the UI's fee-display path is exercised. Deploys locally (deterministic address).                                      |
| `ToggleableAgent.sol`               | AgentMock + a `delayed` flag + `processBuffered(id)` — supports future relayer-driven tests without changing the deterministic address. Deploys locally.  |
