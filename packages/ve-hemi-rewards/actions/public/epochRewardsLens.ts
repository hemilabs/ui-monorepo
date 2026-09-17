import { type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'

// Lens reads cost gas proportional to (epochs x registered tokens). Its NatSpec measures
// two tokens over 80 epochs at 17.3M gas, and twelve tokens over 80 epochs already past a
// node's default 50M `eth_call` cap, so reads are windowed to a pair budget. 192 pairs is
// ~21M gas at those rates. Shared with the pre-flight, which pays the same cost.
export const readPairBudget = 192

// The rewards contract this Lens reads. A redeploy issues new addresses for both, and
// half-updating a config doesn't fail - the mismatched Lens answers plausibly off the
// wrong epoch grid while writes go to the right contract. This is how to catch that.
export const getBoundRewards = (
  client: Client,
  { lensAddress }: { lensAddress: Address },
) =>
  readContract(client, {
    abi: veHemiEpochRewardsLensAbi,
    address: lensAddress,
    functionName: 'rewards',
  })

export const getSystemState = (
  client: Client,
  { lensAddress }: { lensAddress: Address },
) =>
  readContract(client, {
    abi: veHemiEpochRewardsLensAbi,
    address: lensAddress,
    functionName: 'systemState',
  })

/**
 * What a holder can claim for one position, per reward asset, over an epoch range.
 *
 * Each row carries its own `decimals` - the registry mixes 18dp and 8dp assets, so
 * render every amount against the decimals reported beside it.
 *
 * `carry` is not claimable. It is sub-unit dust already inside `claimable`, held per
 * (position, token, holder) rather than per range, so it is the same value in every
 * window. Carry it through; never sum it or add it to `claimable`.
 *
 * Summing windows is not quite the same as one call over the whole range: each window
 * floors its own dust, and the same banked carry sits inside each one's `claimable`, so
 * the paged total can land either side of the single-call figure by under a wei per
 * window per asset. Far below anything we render, but don't state it as a guaranteed
 * under-estimate - the claim chunks on a different boundary again (`claimSpan`).
 */
export const getClaimableByToken = async function (
  client: Client,
  {
    fromEpoch,
    holder,
    lensAddress,
    toEpoch,
    tokenCount,
    tokenId,
  }: {
    fromEpoch: number
    holder: Address
    lensAddress: Address
    toEpoch: number
    tokenCount: number
    tokenId: bigint
  },
) {
  const span = Math.max(1, Math.floor(readPairBudget / Math.max(1, tokenCount)))
  const totals = new Map<
    Address,
    {
      carry: bigint
      claimable: bigint
      decimals: number
      symbol: string
      token: Address
    }
  >()

  for (let from = fromEpoch; from <= toEpoch; from += span) {
    const rows = await readContract(client, {
      abi: veHemiEpochRewardsLensAbi,
      address: lensAddress,
      args: [tokenId, holder, from, Math.min(from + span - 1, toEpoch)],
      functionName: 'claimableByToken',
    })

    for (const row of rows) {
      const running = totals.get(row.token)
      totals.set(row.token, {
        carry: row.carry,
        claimable: (running?.claimable ?? 0n) + row.claimable,
        decimals: row.decimals,
        symbol: row.symbol,
        token: row.token,
      })
    }
  }

  return [...totals.values()]
}
