# ve-hemi-epoch-rewards

viem actions to read and claim veHEMI rewards from the `VeHemiEpochRewards` contract.

Rewards are funded per epoch (about six days) and per reward token, and every veHEMI position earns its share of each epoch it held weight in. All reads go through the contract's Lens, `VeHemiEpochRewardsLens`, which aggregates the figures the rewards contract itself pays.

## Supported chains

| Chain        | `VeHemiEpochRewards`                         | `VeHemiEpochRewardsLens`                     |
| ------------ | -------------------------------------------- | -------------------------------------------- |
| Hemi Sepolia | `0x3858B1F737cc1cA34c97Db5a7cEe1F2B1bE012C8` | `0x5C77b15F0E60D437B1137Ce646D0419Be1315442` |
| Hemi         | `0xC7818357DF04B8FDed091b40AE8D4a0F19295Aa8` | `0xcf8bce2c4e666df2e527a31ba53c1dde0ec58ad6` |

The Hemi mainnet entries are the zero address until the contracts are deployed there, so every call on mainnet targets the zero address. Only use this package on Hemi Sepolia until those entries hold real addresses.

The address getters throw on any other chain. Every action reads the chain from its client, so the client must have `chain` set.

## Exports

From `ve-hemi-epoch-rewards`:

- `veHemiEpochRewardsAbi`, `veHemiEpochRewardsLensAbi`: the contract ABIs.
- `getVeHemiEpochRewardsContractAddress(chainId)`, `getVeHemiEpochRewardsLensContractAddress(chainId)`: the addresses above.
- `getClaimSpan({ maxClaimEpochs, maxClaimPairs, tokenCount })`: the widest epoch range one claim can carry while it still settles every reward token.
- `CaptureAndWithdrawEvents`, `ClaimFromEvents`, `ClaimTokenEvents`: the event maps of the wallet actions.

From `ve-hemi-epoch-rewards/actions`:

### Public actions

- `getSystemState(client)`: the epoch grid, the reward token registry and the pause state, in one read.
- `getMaxClaimPairs(client)`: the maximum number of epoch and token pairs one claim may settle.
- `getClaimableByToken(client, { fromEpoch, holder, toEpoch, tokenId })`: what the holder can claim for a position, per reward token, over an epoch range.
- `getPositionClass(client, { tokenId })`: the class recorded for a position, and whether it was recorded at all.

### Wallet actions

Each wallet action returns `{ emitter, promise }`: the emitter reports every step of the transaction, and the promise settles when the action ends.

- `claimFrom({ account, fromEpoch, toEpoch, tokenId, tokenStart, walletClient })`: claims every reward token of a position over an epoch range, starting at the registry index `tokenStart`. `encodeClaimFrom` encodes the same call, for gas estimates and batches.
- `claimToken({ account, fromEpoch, toEpoch, token, tokenId, walletClient })`: claims a single reward token.
- `captureAndWithdraw({ account, tokenId, veHemiAddress, walletClient })`: withdraws a veHEMI position, and first records its class with the rewards contract when that is still missing.

## Things to know

- **Only the holder can claim.** An epoch is credited to whoever owned the position when the epoch ended, and only that address may claim it. A position that was sold still pays its seller for the epochs before the sale.
- **A claim has a size limit.** The contract bounds each claim by epoch and token pairs, so a position with a long history needs several claims. Use `getClaimSpan` with `getMaxClaimPairs` and the token count from `getSystemState` to split the range.
- **Record the class before a burn.** A position that is burned before its class is recorded pays nothing for any epoch it earned, and this cannot be repaired. Use `captureAndWithdraw` to unlock, not a plain veHEMI `withdraw`.
- **A pause stops claims, not reads.** While the contract is paused, every claim reverts, but the Lens still quotes what each position is owed.
