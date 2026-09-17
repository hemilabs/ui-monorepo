import { type Address, type Client, getAbiItem } from 'viem'
import { getBlockNumber, getCode, getLogs } from 'viem/actions'

import { veHemiEpochRewardsAbi } from '../../epochRewardsAbi.ts'

const claimedEvent = getAbiItem({
  abi: veHemiEpochRewardsAbi,
  name: 'Claimed',
})

export type ClaimedTotal = {
  amount: bigint
  token: Address
  tokenId: bigint
}

// Hemi's public endpoint answers a 3M-block log query in ~150ms near the tip and times
// out on older ranges, and other providers cap the range outright. So start wide and
// halve on failure rather than guessing one size - a generous endpoint costs a couple of
// requests, a strict one backs off on its own.
const firstWindow = BigInt(1_000_000)
const smallestWindow = BigInt(2_000)

/**
 * The block the contract was deployed in, found by bisecting `getCode`.
 *
 * Logs have to be read from somewhere, and scanning from block 0 is not an option: the
 * range is too wide for one request and paging the whole chain is thousands of them.
 * Bisecting costs ~23 cheap calls once, which is worth not making every developer
 * configure a block number next to the two addresses they already paste by hand.
 *
 * Needs an endpoint that serves historical `getCode`. Throws if it does not, and the
 * caller treats that as "no history available" rather than as an empty history.
 */
export const findDeployBlock = async function (
  client: Client,
  { address }: { address: Address },
) {
  const tip = await getBlockNumber(client)
  if (!(await getCode(client, { address }))) {
    throw new Error(`No contract at ${address}`)
  }

  let low = BigInt(0)
  let high = tip
  while (low < high) {
    const middle = (low + high) / BigInt(2)
    const code = await getCode(client, { address, blockNumber: middle })
    if (code && code !== '0x') {
      high = middle
    } else {
      low = middle + BigInt(1)
    }
  }
  return low
}

const readWindow = async function (
  client: Client,
  {
    fromBlock,
    holder,
    rewardsAddress,
    toBlock,
    tokenIds,
  }: {
    fromBlock: bigint
    holder: Address
    rewardsAddress: Address
    toBlock: bigint
    tokenIds?: readonly bigint[]
  },
) {
  const logs = await getLogs(client, {
    address: rewardsAddress,
    args: { holder, ...(tokenIds ? { tokenId: [...tokenIds] } : {}) },
    event: claimedEvent,
    fromBlock,
    toBlock,
  })
  return logs.map(
    (log): ClaimedTotal => ({
      amount: log.args.amount!,
      token: log.args.token!,
      tokenId: log.args.tokenId!,
    }),
  )
}

/**
 * What this holder has already been paid, per position and asset.
 *
 * Read from `Claimed` logs because nothing on-chain accumulates it: `epochTokenClaimed`
 * is a per-epoch total across every holder, and `claimedBits` records which epochs were
 * settled without their amounts. The event carries the amount and indexes tokenId,
 * holder and token, so it answers this directly.
 *
 * Scoped to one holder on purpose. A position can pay several wallets over its life, and
 * the previous owner's rewards are not this wallet's history.
 *
 * Amounts are summed across events rather than read from one: a single claim is signed in
 * chunks, each emitting its own event over a disjoint epoch range. A zero-amount event -
 * a range that resolved owing nothing - adds nothing, which is correct.
 */
export const getClaimedHistory = async function (
  client: Client,
  {
    fromBlock,
    holder,
    rewardsAddress,
    toBlock,
    tokenIds,
  }: {
    fromBlock: bigint
    holder: Address
    rewardsAddress: Address
    toBlock: bigint
    tokenIds?: readonly bigint[]
  },
) {
  const claimed: ClaimedTotal[] = []
  let window = firstWindow
  let from = fromBlock

  while (from <= toBlock) {
    const to = from + window - BigInt(1)
    try {
      claimed.push(
        ...(await readWindow(client, {
          fromBlock: from,
          holder,
          rewardsAddress,
          toBlock: to > toBlock ? toBlock : to,
          tokenIds,
        })),
      )
      from = to + BigInt(1)
    } catch (error) {
      if (window <= smallestWindow) {
        throw error
      }
      window /= BigInt(2)
    }
  }

  return claimed
}
