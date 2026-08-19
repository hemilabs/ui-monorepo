# Domain

This document describes the domain the repo operates in: what Hemi is, how the tunnel works, and how the Portal reconstructs a user's operations. It covers _what_ the product does, not how the code is organized — for that, see the [main README](../README.md) and each workspace's README.

## Hemi

Hemi is a modular Layer-2 network powered by both Bitcoin and Ethereum, presented as a single "supernetwork" rather than an L2 of one parent chain. Three names appear throughout the docs and the code:

- **hVM** (Hemi Virtual Machine): an EVM with a full Bitcoin node embedded in it, so every Hemi node knows Bitcoin's state as well as its own.
- **hBK** (Hemi Bitcoin Kit): the contract-level API on top of the hVM that gives Solidity an indexed view of Bitcoin state — transactions, headers, UTXOs and balances. It is what makes the Bitcoin tunnel possible without a third-party oracle.
- **PoP** (Proof-of-Proof): the consensus mechanism that anchors Hemi's state into Bitcoin, so Hemi transactions inherit Bitcoin's proof-of-work security ("Bitcoin superfinality") after a few hours.

Toward Ethereum, Hemi behaves as an EVM-equivalent rollup: it publishes state roots to L1 and its tunnel contracts are OP Stack ones (`OptimismPortal`, `L2OutputOracle`, `L1CrossDomainMessenger`, `L1StandardBridge`), which is why the Portal drives EVM withdrawals with `viem/op-stack`. Gas on Hemi is paid in ETH.

Users reach all of this through the Portal (`portal/`, <https://app.hemi.xyz>).

## Networks

The Portal always operates under one _network type_, `mainnet` or `testnet`. Chains come in matching sets and are never mixed across types; the user switches the network type globally in the UI.

| Role    | Mainnet             | Testnet                     |
| ------- | ------------------- | --------------------------- |
| L2      | Hemi (`43111`)      | Hemi Sepolia (`743111`)     |
| EVM L1  | Ethereum (`1`)      | Sepolia (`11155111`)        |
| Bitcoin | Bitcoin (`livenet`) | Bitcoin Testnet (`testnet`) |

Notes:

- Bitcoin chain ids are strings, EVM chain ids are numbers. The code uses that difference to tell a Bitcoin operation from an EVM one.
- Public RPCs may be rate-limited, so RPC urls can be overridden per chain through environment variables.
- Some features are mainnet-only and are turned on for testnet through feature flags, mostly for local development.

## The tunnel

"Tunnel" is Hemi's name for its native bridge. There are two independent halves:

- **EVM tunnel** (Ethereum ↔ Hemi): a fork of the OP Stack standard bridge. Deposits and withdrawals follow the optimistic-rollup lifecycle, with a dispute window before a withdrawal can be claimed. Hemi's docs describe challenging as open to any ecosystem participant, but the deployed `L2OutputOracle` still holds a single privileged `CHALLENGER` address — permissionless disputes need the fault-proof contracts, which are not deployed. Either way, disputing is not supported in the UI.
- **Bitcoin tunnel** (Bitcoin ↔ Hemi): the [`BitcoinTunnelManager`](https://github.com/hemilabs/bitcoin-tunnel-contracts/blob/main/contracts/BitcoinTunnelManager.sol) contract on Hemi plus a set of custody vaults. Bitcoin has no smart contracts, so this half depends on vault operators — currently over-collateralized multisig / threshold-signature custodians — together with the hVM's ability to read Bitcoin state and slash misbehavior. The contracts are open source in [hemilabs/bitcoin-tunnel-contracts](https://github.com/hemilabs/bitcoin-tunnel-contracts), which is the best reference for how a vault actually behaves.

There is no direct Ethereum ↔ Bitcoin tunnel: moving value between those chains means two separate operations through Hemi.

The tunnel lives on the `/tunnel` page, and past operations on `/tunnel/transaction-history`.

### Ethereum → Hemi (deposit)

1. **Approve** (ERC-20 only): the user approves the L1 standard bridge to spend the token. Native ETH skips this step.
2. **Deposit** on L1: funds are locked in the L1 bridge contract.
3. **Wait**: the sequencer includes the deposit in the first Hemi block derived from that L1 block, and the token is minted on Hemi. No second user action is needed. Waiting time may be up to ~3 minutes.

Statuses (`EvmDepositStatus`): `APPROVAL_TX_PENDING` → `APPROVAL_TX_COMPLETED` → `DEPOSIT_TX_PENDING` → `DEPOSIT_TX_CONFIRMED` → `DEPOSIT_RELAYED`, plus `APPROVAL_TX_FAILED` and `DEPOSIT_TX_FAILED` branches.

### Hemi → Ethereum (withdrawal)

Withdrawals are the slow direction and need three separate user transactions, which is why the UI is step-based.

1. **Initiate** on Hemi: burns the L2 tokens and emits the withdrawal message.
2. **Prove** on L1: available once the Hemi state root covering that block has been published to L1 by the proposer — the `PROPOSER` role on `L2OutputOracle`, which Hemi's docs call the Publisher. Until then the withdrawal sits in `STATE_ROOT_NOT_PUBLISHED`. On mainnet the UI announces a wait of **~40 minutes**.
3. **Claim** (finalize) on L1: available once the dispute window elapses, **24 hours** after proving on mainnet, and releases the funds.

Statuses follow OP's message lifecycle (`MessageStatus`): `STATE_ROOT_NOT_PUBLISHED` → `READY_TO_PROVE` → `IN_CHALLENGE_PERIOD` → `READY_FOR_RELAY` → `RELAYED`.

Those are the figures the UI announces before each step becomes reachable, and the proving one is padded on purpose so the estimate errs on the long side. Once a withdrawal reaches the matching status the UI drops them and counts down the live value read from the chain, falling back to the announced figure only if that read fails.

The real bound comes from the `L2OutputOracle` deployed on Ethereum, which the Portal reads through `viem/op-stack`. Its mainnet values, as deployed today, are:

| Parameter                     | Value      | Meaning                                                        |
| ----------------------------- | ---------- | -------------------------------------------------------------- |
| `SUBMISSION_INTERVAL`         | 120 blocks | State roots are proposed every 120 Hemi blocks                 |
| `L2_BLOCK_TIME`               | 12 s       | So one proposal every 1440 s, i.e. 24 minutes                  |
| `FINALIZATION_PERIOD_SECONDS` | 86400 s    | The dispute window between proving and claiming, i.e. 24 hours |

Proving is therefore reachable within ~24 minutes at worst — ~26 with the 1.1 buffer `viem` applies to its estimate — against the 40 the UI announces, while the 24 hours before claiming matches the contract exactly. End to end the worst case sits slightly above 24 hours, far shorter than the week-long window of a stock optimistic rollup, because Hemi's dispute window leans on Bitcoin finality through PoP.

Since the flow spans hours and can be interrupted, a withdrawal may be abandoned mid-way and resumed later, possibly from another device. The Portal therefore has to be able to reconstruct the state of a withdrawal from on-chain data alone.

### Bitcoin → Hemi (deposit)

Bitcoin cannot be locked by a contract, so deposits are sent to a Bitcoin address controlled by a **vault**. Vaults are identified by index; the active ones per network are configurable, and past vaults stay configured so older operations remain visible.

Each direction resolves its vault independently: deposits and withdrawals have their own configurable index, both falling back to the vault that used to serve the two flows when only that one is set. The vault is never user-selectable, just resolved per flow. They may still point at the same vault, so nothing may assume they differ either. Deposit history syncing scans the deposit vault, the withdrawal vault and every past vault, because deposits made back when a single vault served both directions may sit in the withdrawal one.

1. The user sends BTC to the vault's custody address, with the destination Hemi address embedded in the transaction as an `OP_RETURN` output. This requires a Bitcoin wallet (Unisat or OKX) and an EVM wallet for the receiving address.
2. The transaction is mined on Bitcoin. The hVM sees the deposit by watching Bitcoin's UTXO set.
3. The **vault operator** acknowledges the deposit, and hemiBTC — the ERC-20 representation of BTC — is minted on Hemi. Nothing in the Portal gates this on a confirmation count: the operator path is decided purely by whether the vault has acknowledged the deposit.
4. If the operator has not acted once the transaction passes **6 confirmations** — roughly an hour — the user can **confirm the deposit manually**: a transaction on Hemi that proves the Bitcoin deposit and mints the tokens without the operator. This is the escape hatch that keeps the tunnel trust-minimized.

Statuses (`BtcDepositStatus`): `BTC_TX_PENDING` → `BTC_TX_CONFIRMED` → `BTC_DEPOSITED` on the operator path, or `BTC_TX_CONFIRMED` → `READY_TO_MANUAL_CONFIRM` → `DEPOSIT_MANUAL_CONFIRMING` → `BTC_DEPOSITED_MANUALLY` on the manual one. Failures land in `BTC_TX_FAILED` or `DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED`.

Deposits have a minimum amount in satoshis (`MINIMUM_DEPOSIT_SATS`) and a tunnel fee, both configured on the vault contract — see [`SimpleBitcoinVault.sol`](https://github.com/hemilabs/bitcoin-tunnel-contracts/blob/main/contracts/vaults/SimpleBitcoinVault/SimpleBitcoinVault.sol) — and read from there by the Portal. The amount received on Hemi is therefore smaller than the amount sent, which is why operations carry both `amount` and `grossAmount`.

### Hemi → Bitcoin (withdrawal)

1. The user sends a transaction on Hemi (`BitcoinTunnelManager`) that burns hemiBTC and requests a payout to a Bitcoin address. The withdrawal is identified by a `uuid`.
2. The vault's custodians collect the signatures needed to release the BTC, send it on Bitcoin and mark the withdrawal fulfilled. This is the happy path, and the UI shows a wait of **12 hours** on mainnet — read live from the vault, never hardcoded.
3. If the operator does not fulfil it before the vault's **grace period** expires, the withdrawal becomes challengeable. A **challenge** transaction on Hemi reverses the burn and returns the hemiBTC to the user's Hemi address, so they can try again.

Statuses (`BtcWithdrawStatus`): `INITIATE_WITHDRAW_PENDING` → `INITIATE_WITHDRAW_CONFIRMED` → `WITHDRAWAL_SUCCEEDED`, or `INITIATE_WITHDRAW_CONFIRMED` → `READY_TO_CHALLENGE` → `CHALLENGE_IN_PROGRESS` → `WITHDRAWAL_CHALLENGED`. Failures land in `WITHDRAWAL_FAILED` or `CHALLENGE_FAILED`.

That 12 hours is the vault's own `WITHDRAWAL_GRACE_PERIOD_SECONDS`, read from the contract and rendered as the wait for the step — unlike the EVM flow, there is no hardcoded fallback, only a skeleton while the value loads. It is set to 43200 s on every vault deployed on mainnet today, so the figure shown is the deadline itself rather than a padded estimate: the same instant is both when the custodians are expected to be done and when challenging opens. [`SimpleBitcoinVault.sol`](https://github.com/hemilabs/bitcoin-tunnel-contracts/blob/main/contracts/vaults/SimpleBitcoinVault/SimpleBitcoinVault.sol) is where the grace period is checked before a challenge is accepted.

Unlike the EVM side, the challenge does not deliver the BTC — it undoes the withdrawal. Withdrawals also have a minimum amount (`MINIMUM_WITHDRAWAL_SATS`) and a fee, configured on the vault contract like the deposit ones.

### Third-party bridges

The native tunnel is not the only route in and out of Hemi. For EVM ↔ EVM transfers the Portal also offers a "3rd party bridge" tab listing partner bridges.

- The Portal only links out to partners. It does not execute or track those transfers, and the UI states they are used at the user's own risk.
- Some tokens cannot be tunneled natively and are whitelisted to specific partners instead: USDC and USDT on both Ethereum and Hemi, cbBTC on Ethereum only. For those, the partner list replaces the native form instead of sitting next to it.

## Staking

The "Stake" entry of the nav covers two unrelated products, sharing a word and nothing else — different contracts, different tokens, different purpose. Only the first is described here; **boost staking**, where allowlisted tokens are parked in a staking contract, is not documented yet.

### Governance staking (veHEMI)

Governance staking lives on `/staking-dashboard`. The user locks HEMI in the [`VeHemi`](https://github.com/hemilabs/veHEMI/blob/main/src/VeHemi.sol) contract on Hemi and receives an ERC-721 (symbol `veHemi`) representing that lock. The design is a voting-escrow one, in the veCRV tradition: the longer the lock, the more weight it carries. It is a mainnet feature; testnet is gated behind `VITE_ENABLE_STAKE_GOVERNANCE_TESTNET` and uses a testnet token.

Lock parameters, all enforced by the contract:

| Parameter                                                                                                                | Value                                 | Notes                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`MIN_LOCK_AMOUNT`](https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L92) | 10 HEMI                               | Below it, [`createLock` reverts with `AmountTooSmall`](https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L964) |
| [`SIX_DAYS`](https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L89)        | 525,960 s, approximately 6 days       | `YEAR / 60`, with `YEAR = 365.25 days`; the epoch every timestamp is rounded to                                                                              |
| [Minimum lock](https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L960)     | `2 * SIX_DAYS`, approximately 12 days | The UI announces 12 days and clamps the value it sends up to the exact constant                                                                              |
| [`MAX_TIME`](https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L90)        | `4 * YEAR`, i.e. 1461 days            | `createLock` and `increaseUnlockTime` reject anything longer                                                                                                 |

The links point at a pinned commit, so the lines stay meaningful; `main` is the authority on the current source, and the chain on the deployed values.

Lock durations are given as a duration from now, and the resulting unlock time is rounded **down** to the epoch grid, so the actual unlock date is at most one epoch earlier than requested. The epoch is a "six days" that is not exactly six days, and the UI's 6 calendar-day slider steps approximate the grid rather than matching it — so treat every duration the UI shows as approximate and let the contract decide the real unlock date.

The 10 HEMI minimum is only enforced on-chain: the staking form does not validate it, so a smaller amount can be submitted and reverts with `AmountTooSmall`. Tracked in [#2189](https://github.com/hemilabs/ui-monorepo/issues/2189).

Weight — used both for voting and for reward distribution — is `amount * (lock end - now) / MAX_TIME`. It therefore grows linearly with the remaining lock time and decays linearly to zero at the unlock date: 100 HEMI locked for the maximum four years starts at roughly 100 veHEMI, the same amount locked for one year at roughly 25. "Roughly" because the unlock date is rounded down to the epoch grid and the per-second slope is truncated, so the figure sits slightly below the round number.

A position can only grow:

- **Increase the amount**: more HEMI is added to the same NFT. There is no owner check on-chain, so anyone can top up anyone's position.
- **Extend the lock**: only the owner, and the new end — again a duration from now, rounded down — must be strictly later than the current one and still within four years from now.

Nothing shrinks a position: there is no partial withdrawal and no way to shorten a lock. The principal comes back through `withdraw`, which is only callable once the lock has expired and which burns the NFT. A user may hold as many positions as they want; each is independent.

Owning a position may also accrue **rewards** distributed by the protocol through the veHEMI rewards contract, in one or more reward tokens. Rewards are allocated per position by the same decaying weight — the Portal's APR estimate reads it back with `balanceOfNFTAt(tokenId, now)`. Claiming is per position and takes everything at once, across every reward token, and is paid out to the position's owner: the row's menu offers the action only while that position has something to claim, and claiming leaves the lock untouched, so the position keeps running afterwards. The APR shown next to it is an estimate: the Portal projects the position's weight over the next 61 six-day epochs and dots it against the rewards-per-veHEMI series served by `portal-backend/api` under `/ve-hemi-rewards/{chainId}`.

Positions are ERC-721s. The Portal only ever creates them through `createLock`, which mints transferable, non-forfeitable positions, and it exposes no transfer action of its own — so transfers happen outside of it. It does show their consequences: the positions query matches the connected address as current owner _or_ as a past owner, and rows are tagged as received, transferred away or delegated away.

The Portal does not support voting or delegating: the contracts carry both, but the interface for them is expected to live on external sites. What the Portal shows is the resulting weight, and the two cards on top of the dashboard are not the same quantity: "Your positions" sums the weight of the connected account's own positions that are still delegated to itself, so it drops to zero for a position delegated away, while "Total voting power" is `getVotes` for the account and therefore counts every position delegated **to** it, including other people's.

The dashboard lists positions under two tabs, **Active** and **Burned**. Burned is the subgraph's `withdrawn` status, written when the contract emits `Withdraw` — which covers the ordinary unlock at expiry as well as a forfeit, the admin claw-back path the Portal does not expose.

Statuses follow the same shape as the tunnel ones but per operation: `StakingDashboardStatus` covers the approval and the lock transaction (`APPROVAL_TX_PENDING` → `APPROVAL_TX_COMPLETED` → `STAKE_TX_PENDING` → `STAKE_TX_CONFIRMED`, with `*_FAILED` branches) and is reused for the increase-amount and extend flows, while `UnlockingDashboardStatus` and `CollectAllRewardsDashboardStatus` cover unlocking and claiming.

The list of positions comes from the veHEMI subgraph through `portal-backend/api` (`/subgraphs/{chainId}/locks/{address}`). Voting power and claimable rewards are read live from the chain. The APR mixes both sources: the position's weight comes from the chain, while the rewards-per-veHEMI series comes from `portal-backend/api`. The countdown to unlock is derived in the browser from the `timestamp` and `lockTime` the subgraph returns.

## Subgraphs

The Portal needs a user's full operation history across the three chains of the active network type — Hemi, the EVM L1 and Bitcoin — and rebuilding it by scanning blocks over RPC is slow and rate-limited. Subgraphs (The Graph) index the relevant events so history can be queried in bulk.

The `subgraphs/` folder holds one subgraph per concern. The tunnel-related ones cover deposits, BTC deposits, withdrawals, and withdrawal proofs and claims; the rest cover Hemi Earn, staking, veHEMI and Merkle claims. Every subgraph is deployed once per chain, so mainnet and testnet are separate deployments.

The Portal does not query The Graph directly. Requests go through the backend API (`portal-backend/api`) under `/subgraphs/{chainId}/...`, which keeps API keys server-side and normalizes responses.

History itself is assembled in web workers so the UI stays responsive. The workers combine subgraph data with direct RPC reads — a subgraph lags behind the chain head, so recent blocks are still scanned — track how far each chain has been synced, and persist the result locally so a returning user sees their history immediately. Operation status is then refreshed against chain state: whether a withdrawal is provable, claimable or challengeable is always decided by the contracts, never by the cached record.

## Further reading

- [Hemi docs](https://docs.hemi.xyz), in particular [Tunnels](https://docs.hemi.xyz/foundational-topics/the-architecture/tunneling), [Ethereum Tunnel](https://docs.hemi.xyz/foundational-topics/the-architecture/tunneling/ethereum-tunnel), [Bitcoin Tunnel](https://docs.hemi.xyz/foundational-topics/the-architecture/tunneling/bitcoin-tunnel) and [Network details](https://docs.hemi.xyz/discover/network-details)
- [Whitepaper](https://static.hemi.xyz/whitepaper.pdf), for the detail on hVM, hBK and Proof-of-Proof
- [hemilabs/veHEMI](https://github.com/hemilabs/veHEMI), the governance staking contracts: [`VeHemi.sol`](https://github.com/hemilabs/veHEMI/blob/main/src/VeHemi.sol) for the locks themselves, plus the delegation contract and the Aragon adapter its README describes
- [hemilabs/bitcoin-tunnel-contracts](https://github.com/hemilabs/bitcoin-tunnel-contracts), the Bitcoin tunnel contracts: [`BitcoinTunnelManager.sol`](https://github.com/hemilabs/bitcoin-tunnel-contracts/blob/main/contracts/BitcoinTunnelManager.sol) and the [`SimpleBitcoinVault`](https://github.com/hemilabs/bitcoin-tunnel-contracts/tree/main/contracts/vaults/SimpleBitcoinVault) family, which hold the deposit, withdrawal and challenge logic described above. Its `main` branch is not necessarily what is deployed, so treat it as a reference for mechanics and the chain as the authority on values

The timings and limits quoted here — wait times, confirmations, minimums, fees — are indicative. They come from deployed contracts and from a roadmap that is still moving, so code should read them from the chain, and this document should be re-checked against the docs before any of them is relied upon.
