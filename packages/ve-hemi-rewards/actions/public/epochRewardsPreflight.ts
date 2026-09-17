import {
  type Address,
  BaseError,
  type Client,
  ContractFunctionRevertedError,
} from 'viem'
import { readContract, simulateContract } from 'viem/actions'

import { veHemiEpochRewardsAbi } from '../../epochRewardsAbi.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'

import { readPairBudget } from './epochRewardsLens.ts'

export type TokenSettlement = {
  // The raw node error, for logging. Never rendered - it is in no locale.
  error?: string
  /**
   * `settles` - a claim for this asset simulates cleanly.
   * `reverts` - the contract refused it. This is the blocked asset the hatch exists for.
   * `nothing-owed` - the asset owes this position nothing over the whole range, so there
   *   is no call to make and no blocklist to discover.
   * `unknown` - the simulation could not be completed (node failure, timeout). Not a
   *   verdict about the asset; calling it blocked would invent a blocklist from a bad
   *   connection.
   */
  state: 'nothing-owed' | 'reverts' | 'settles' | 'unknown'
  token: Address
}

// Only a refusal from the contract says anything about the asset; transport errors,
// timeouts and rate limits are about the connection.
//
// Discriminate on `raw`, not on the error type: viem also synthesises a
// ContractFunctionRevertedError for a bare JSON-RPC -32603, and believing that would
// invent a blocklist from a flaky node. `raw` is only set when revert data came back. A
// dataless revert is demoted to `unknown`, which errs the safe way - the button stays
// usable and the claim action simulates again before signing.
const isContractRevert = function (error: unknown) {
  const reverted =
    error instanceof BaseError
      ? error.walk(e => e instanceof ContractFunctionRevertedError)
      : null
  return (
    reverted instanceof ContractFunctionRevertedError &&
    reverted.raw !== undefined
  )
}

/**
 * Which registered assets this holder can settle, asked one asset at a time.
 *
 * The whole-registry `claim` reverts as a whole, so one asset refusing its transfer - a
 * blocklisted holder on a USDC-shaped token - takes the entire claim down with it.
 * Simulating each asset separately is what tells the escape hatch which are payable.
 *
 * Two things the simulation has to get right. It asks about the same bounded window the
 * write would sign, because `claimToken` is bounded by MAX_CLAIM_EPOCHS and a full span
 * fails with a range error on any mature deployment. And it asks about a window the
 * asset actually pays in, because a window owing nothing performs no transfer and so
 * simulates cleanly however blocked the asset is.
 *
 * Not multicall-batched: the contract requires `msg.sender` to be the `holder` argument,
 * so a batch comes back reverted for every asset. These are plain parallel `eth_call`s,
 * which the app's transport coalesces anyway.
 */
export const getSettleableTokens = async function (
  client: Client,
  {
    fromEpoch,
    holder,
    lensAddress,
    maxClaimEpochs,
    paused,
    rewardsAddress,
    toEpoch,
    tokenId,
    tokens,
  }: {
    fromEpoch: number
    holder: Address
    lensAddress: Address
    maxClaimEpochs: number
    paused: boolean
    rewardsAddress: Address
    toEpoch: number
    tokenId: bigint
    tokens: readonly Address[]
  },
) {
  // A pause reverts every simulation below with `ContractPaused`, which carries data and
  // so is indistinguishable from a token refusing the transfer. A global, temporary
  // pause reported as a per-asset blocklist sends the holder after the wrong problem.
  if (paused) {
    return tokens.map((token): TokenSettlement => ({ state: 'unknown', token }))
  }

  // Bounded by the same pair budget as the other Lens reads, not by the claim's epoch
  // bound alone. Lens cost is (epochs x tokens), so maxClaimEpochs is fine against two
  // assets and 512 pairs against eight - past a node's gas cap.
  const span = Math.max(
    1,
    Math.min(
      maxClaimEpochs,
      Math.floor(readPairBudget / Math.max(1, tokens.length)),
    ),
  )

  const remaining = new Set(tokens.map(token => token.toLowerCase()))
  // The first window each asset is owed something in. One Lens read answers for every
  // asset, and the scan stops once all of them are placed - counted against the tokens
  // asked about, so an extra row in the response can't end it early.
  const payableWindow = new Map<string, { from: number; to: number }>()
  let scanFailed = false
  for (
    let from = fromEpoch;
    from <= toEpoch && remaining.size > 0;
    from += span
  ) {
    const to = Math.min(from + span - 1, toEpoch)
    const rows = await readContract(client, {
      abi: veHemiEpochRewardsLensAbi,
      address: lensAddress,
      args: [tokenId, holder, from, to],
      functionName: 'claimableByToken',
    }).catch(function () {
      // One failed window must not destroy the whole answer. Anything still unplaced
      // becomes `unknown`, not `nothing-owed` - the latter would disable the button on
      // the strength of a read that never came back.
      scanFailed = true
      return undefined
    })
    if (rows === undefined) {
      break
    }
    rows.forEach(function (row) {
      const key = row.token.toLowerCase()
      if (row.claimable > BigInt(0) && remaining.has(key)) {
        payableWindow.set(key, { from, to })
        remaining.delete(key)
      }
    })
  }

  return Promise.all(
    tokens.map(function (token): Promise<TokenSettlement> {
      const window = payableWindow.get(token.toLowerCase())
      if (window === undefined) {
        return Promise.resolve({
          state: scanFailed ? 'unknown' : 'nothing-owed',
          token,
        })
      }
      return simulateContract(client, {
        abi: veHemiEpochRewardsAbi,
        account: holder,
        address: rewardsAddress,
        args: [tokenId, holder, token, window.from, window.to],
        functionName: 'claimToken',
      }).then(
        (): TokenSettlement => ({ state: 'settles', token }),
        (error: Error): TokenSettlement => ({
          error: error.message,
          state: isContractRevert(error) ? 'reverts' : 'unknown',
          token,
        }),
      )
    }),
  )
}
