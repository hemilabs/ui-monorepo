import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type Client,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
} from 'viem'
import {
  getAddresses,
  getChainId,
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'

import { veHemiEpochRewardsAbi } from '../../epochRewardsAbi.ts'
import { veHemiEpochRewardsLensAbi } from '../../lensAbi.ts'
import type {
  ClaimEpochRewardsEvents,
  ClaimEpochRewardsProgress,
} from '../../types.ts'
import {
  chunksFor,
  claimSpan,
  type EpochClaimChunk,
} from '../public/epochClaimPlan.ts'

type Params = {
  chainId: number
  fromEpoch: number
  holder: Address
  lensAddress: Address
  // The app's public transport is batched and cached; the injected wallet's is neither.
  publicClient: Client
  rewardsAddress: Address
  toEpoch: number
  tokenId: bigint
  walletClient: WalletClient
}

// `preview` quotes while paused on purpose, so the figure on screen stays right even
// though it cannot be collected yet. And a registry too large for one token page would
// need the cursor, so refuse rather than settling a prefix and calling it done.
const systemRefusal = function (systemState: {
  maxTokensPerClaim: bigint
  paused: boolean
  tokens: readonly unknown[]
}) {
  if (systemState.paused) {
    return 'contract paused'
  }
  return systemState.tokens.length > Number(systemState.maxTokensPerClaim)
    ? 'reward registry too large for a single page'
    : undefined
}

/**
 * Everything that has to hold for this chunk, immediately before it is signed.
 *
 * Re-asserted per transaction rather than once for the sequence: `claim` is holder-only,
 * and a wallet that switches chain or account midway would revert on-chain with the user
 * already committed to a multi-step flow.
 *
 * The chain is asked of the wallet, not of `walletClient.chain` - wagmi resolves that
 * from the chain the client was requested for, so it reports Hemi whatever network the
 * wallet is on, and a guard against it can never fire.
 *
 * The simulation is the contract's answer about the exact call about to be signed. A
 * `claim` that settles only part of the registry returns a non-zero cursor and reverts
 * nothing, and a receipt cannot carry that. It also catches a pause, the wrong holder
 * and a reverting asset before anyone is asked for a signature.
 */
const mayClaimChunk = async function ({
  chainId,
  chunk,
  emitter,
  holder,
  publicClient,
  rewardsAddress,
  tokenId,
  walletClient,
}: {
  chainId: number
  chunk: EpochClaimChunk
  emitter: EventEmitter<ClaimEpochRewardsEvents>
  holder: Address
  publicClient: Client
  rewardsAddress: Address
  tokenId: bigint
  walletClient: WalletClient
}) {
  if ((await getChainId(walletClient)) !== chainId) {
    emitter.emit('claim-epoch-rewards-failed-validation', 'wrong chain')
    return false
  }

  const [connected] = await getAddresses(walletClient)
  if (connected?.toLowerCase() !== holder.toLowerCase()) {
    emitter.emit('claim-epoch-rewards-failed-validation', 'holder changed')
    return false
  }

  const simulated = await simulateContract(publicClient, {
    abi: veHemiEpochRewardsAbi,
    account: holder,
    address: rewardsAddress,
    args: [tokenId, holder, chunk.from, chunk.to],
    functionName: 'claim',
  }).catch(function (error) {
    emitter.emit('claim-epoch-rewards-failed', error as Error)
    return undefined
  })

  if (!simulated) {
    return false
  }
  if (simulated.result !== 0n) {
    emitter.emit(
      'claim-epoch-rewards-failed-validation',
      'reward registry too large for a single page',
    )
    return false
  }
  return true
}

// Neither settled anything, but they are not the same event: cancelling is a choice,
// the same one as rejecting the prompt, while a substituted transaction is a failure.
const reportReplacement = function (
  emitter: EventEmitter<ClaimEpochRewardsEvents>,
  outcome: 'cancelled' | 'replaced',
) {
  if (outcome === 'cancelled') {
    emitter.emit(
      'user-signing-claim-epoch-rewards-error',
      new Error('the claim transaction was cancelled from the wallet'),
    )
    return
  }
  emitter.emit(
    'claim-epoch-rewards-failed',
    new Error(
      'the claim transaction was replaced from the wallet and settled no epochs',
    ),
  )
}

/**
 * Waits for a claim transaction, and says what actually happened to it.
 *
 * Speeding up or cancelling from the wallet replaces the transaction at the same nonce,
 * and viem follows the replacement and resolves with its receipt whichever it was. So a
 * cancellation arrives as a successful receipt for a zero-value self-send, which would
 * otherwise be reported as a paid chunk linking to a transfer of nothing.
 *
 * Only `repriced` is the same claim - same recipient, value and calldata, new gas price.
 */
const waitForClaim = async function (
  walletClient: WalletClient,
  hash: Hash,
): Promise<
  | { outcome: 'settled'; receipt: TransactionReceipt }
  | { outcome: 'cancelled' | 'replaced' }
> {
  let replacement: 'cancelled' | 'replaced' | undefined
  const receipt = await waitForTransactionReceipt(walletClient, {
    hash,
    onReplaced(replaced) {
      if (replaced.reason !== 'repriced') {
        replacement = replaced.reason === 'cancelled' ? 'cancelled' : 'replaced'
      }
    },
  })
  return replacement
    ? { outcome: replacement }
    : { outcome: 'settled', receipt }
}

// Waits for one chunk and reports anything that is not a settled, successful claim.
// Returns the receipt only when the chunk actually paid, so the caller has one thing to
// check rather than four.
const settleChunk = async function ({
  emitter,
  hash,
  progress,
  walletClient,
}: {
  emitter: EventEmitter<ClaimEpochRewardsEvents>
  hash: Hash
  progress: ClaimEpochRewardsProgress
  walletClient: WalletClient
}) {
  const settlement = await waitForClaim(walletClient, hash).catch(
    function (error) {
      emitter.emit('claim-epoch-rewards-failed', error as Error)
      return undefined
    },
  )

  if (!settlement) {
    return undefined
  }
  if (settlement.outcome !== 'settled') {
    reportReplacement(emitter, settlement.outcome)
    return undefined
  }
  if (settlement.receipt.status !== 'success') {
    emitter.emit('claim-epoch-chunk-reverted', settlement.receipt, progress)
    return undefined
  }
  return settlement.receipt
}

const runClaim = (params: Params) =>
  async function (emitter: EventEmitter<ClaimEpochRewardsEvents>) {
    const {
      chainId,
      fromEpoch,
      holder,
      lensAddress,
      publicClient,
      rewardsAddress,
      toEpoch,
      tokenId,
      walletClient,
    } = params

    try {
      if (toEpoch < fromEpoch) {
        emitter.emit(
          'claim-epoch-rewards-failed-validation',
          'empty epoch range',
        )
        return
      }

      const [maxClaimPairs, systemState] = await Promise.all([
        readContract(publicClient, {
          abi: veHemiEpochRewardsAbi,
          address: rewardsAddress,
          functionName: 'MAX_CLAIM_PAIRS',
        }),
        readContract(publicClient, {
          abi: veHemiEpochRewardsLensAbi,
          address: lensAddress,
          functionName: 'systemState',
        }),
      ])

      const refusal = systemRefusal(systemState)
      if (refusal) {
        emitter.emit('claim-epoch-rewards-failed-validation', refusal)
        return
      }

      const tokenCount = systemState.tokens.length

      // Frozen before the first signature. `planClaim` carries no per-holder state, so
      // re-deriving mid-sequence would either never advance or move the target under
      // someone who is already signing.
      const span = claimSpan({
        maxClaimEpochs: Number(systemState.maxClaimEpochs),
        maxClaimPairs: Number(maxClaimPairs),
        tokenCount,
      })

      const candidates = chunksFor({ fromEpoch, span, toEpoch })

      // Every chunk is a wallet prompt, so chunks that pay nothing are skipped. That
      // costs nothing - claiming is idempotent and an unresolved epoch stays claimable.
      //
      // Issued together rather than in a loop: the reads are independent and the app's
      // transport batches on a scheduler wait, which a serial loop pays once per chunk.
      // Measured 10.5s against the live Lens for nine chunks, versus 1.2s here.
      const claimableByChunk = await Promise.all(
        candidates.map(chunk =>
          readContract(publicClient, {
            abi: veHemiEpochRewardsLensAbi,
            address: lensAddress,
            args: [tokenId, holder, chunk.from, chunk.to],
            functionName: 'claimableByToken',
          }),
        ),
      )
      const payable = candidates.filter((_unused, index) =>
        claimableByChunk[index].some(row => row.claimable > 0n),
      )

      if (payable.length === 0) {
        emitter.emit('nothing-to-claim')
        return
      }

      // Numbered from 1 - this is the first chunk being prepared, not a zeroth one.
      emitter.emit('pre-claim-epoch-rewards', {
        chunk: 1,
        chunks: payable.length,
        from: payable[0].from,
        to: payable[0].to,
      })

      for (const [index, chunk] of payable.entries()) {
        const progress: ClaimEpochRewardsProgress = {
          chunk: index + 1,
          chunks: payable.length,
          from: chunk.from,
          to: chunk.to,
        }

        // Announced before the guards below, so a failure lands on the chunk it
        // stopped on rather than on the last one that succeeded.
        emitter.emit('pre-claim-epoch-chunk', progress)

        const maySign = await mayClaimChunk({
          chainId,
          chunk,
          emitter,
          holder,
          publicClient,
          rewardsAddress,
          tokenId,
          walletClient,
        })
        if (!maySign) {
          return
        }

        const hash = await writeContract(walletClient, {
          abi: veHemiEpochRewardsAbi,
          account: holder,
          address: rewardsAddress,
          // The four-argument form; `claimFrom` and its cursor are out of reach here.
          args: [tokenId, holder, chunk.from, chunk.to],
          chain: walletClient.chain,
          functionName: 'claim',
        }).catch(function (error) {
          emitter.emit('user-signing-claim-epoch-rewards-error', error)
        })

        if (!hash) {
          return
        }

        emitter.emit('user-signed-claim-epoch-chunk', hash, progress)

        const receipt = await settleChunk({
          emitter,
          hash,
          progress,
          walletClient,
        })
        if (!receipt) {
          return
        }

        emitter.emit('claim-epoch-chunk-succeeded', receipt, progress)
      }
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-epoch-rewards-settled')
    }
  }

export const claimEpochRewards = (...args: Parameters<typeof runClaim>) =>
  toPromiseEvent<ClaimEpochRewardsEvents>(runClaim(...args))
