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
  ClaimEpochRewardsProgress,
  ClaimEpochRewardsTokenEvents,
} from '../../types.ts'
// The shared planner, not a second copy of the same loop: two of these drifting apart is
// how a claim ends up signing a call the contract refuses.
import { chunksFor, type EpochClaimChunk } from '../public/epochClaimPlan.ts'

type Params = {
  chainId: number
  fromEpoch: number
  holder: Address
  lensAddress: Address
  // The app's public transport is batched and cached; the injected wallet's is neither.
  publicClient: Client
  rewardsAddress: Address
  toEpoch: number
  token: Address
  tokenId: bigint
  walletClient: WalletClient
}

// Neither settled anything, but they are not the same event: cancelling is a choice,
// the same one as rejecting the prompt, while a substituted transaction is a failure.
const reportReplacement = function (
  emitter: EventEmitter<ClaimEpochRewardsTokenEvents>,
  outcome: 'cancelled' | 'replaced',
) {
  if (outcome === 'cancelled') {
    emitter.emit(
      'user-signing-claim-epoch-token-error',
      new Error('the claim transaction was cancelled from the wallet'),
    )
    return
  }
  emitter.emit(
    'claim-epoch-token-failed',
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

/**
 * Everything that has to hold for this chunk, immediately before it is signed.
 *
 * Re-asserted per transaction rather than once for the sequence: `claimToken` is
 * holder-only, and a wallet that switches chain or account midway would revert on-chain
 * with the user already committed to a multi-step flow.
 *
 * The chain is asked of the wallet, not of `walletClient.chain` - wagmi resolves that
 * from the chain the client was requested for, so it reports Hemi whatever network the
 * wallet is on, and a guard against it can never fire.
 *
 * The simulation is the contract answering about the exact call about to be signed
 * rather than this code predicting it. A blocklisted holder is the reason this action
 * exists, and that revert belongs to the asset's own transfer.
 */
const mayClaimChunk = async function ({
  chainId,
  chunk,
  emitter,
  holder,
  publicClient,
  rewardsAddress,
  token,
  tokenId,
  walletClient,
}: {
  chainId: number
  chunk: EpochClaimChunk
  emitter: EventEmitter<ClaimEpochRewardsTokenEvents>
  holder: Address
  publicClient: Client
  rewardsAddress: Address
  token: Address
  tokenId: bigint
  walletClient: WalletClient
}) {
  if ((await getChainId(walletClient)) !== chainId) {
    emitter.emit('claim-epoch-token-failed-validation', 'wrong chain')
    return false
  }

  const [connected] = await getAddresses(walletClient)
  if (connected?.toLowerCase() !== holder.toLowerCase()) {
    emitter.emit(
      'claim-epoch-token-failed-validation',
      'wallet account changed',
    )
    return false
  }

  try {
    await simulateContract(publicClient, {
      abi: veHemiEpochRewardsAbi,
      account: holder,
      address: rewardsAddress,
      args: [tokenId, holder, token, chunk.from, chunk.to],
      functionName: 'claimToken',
    })
  } catch (error) {
    emitter.emit('claim-epoch-token-failed', error as Error)
    return false
  }
  return true
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
  emitter: EventEmitter<ClaimEpochRewardsTokenEvents>
  hash: Hash
  progress: ClaimEpochRewardsProgress
  walletClient: WalletClient
}) {
  const settlement = await waitForClaim(walletClient, hash).catch(
    function (error) {
      emitter.emit('claim-epoch-token-failed', error as Error)
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
    emitter.emit(
      'claim-epoch-token-chunk-reverted',
      settlement.receipt,
      progress,
    )
    return undefined
  }
  return settlement.receipt
}

const runClaimToken = (params: Params) =>
  async function (emitter: EventEmitter<ClaimEpochRewardsTokenEvents>) {
    const {
      chainId,
      fromEpoch,
      holder,
      lensAddress,
      publicClient,
      rewardsAddress,
      toEpoch,
      token,
      tokenId,
      walletClient,
    } = params

    try {
      if (toEpoch < fromEpoch) {
        emitter.emit('claim-epoch-token-failed-validation', 'empty epoch range')
        return
      }

      const systemState = await readContract(publicClient, {
        abi: veHemiEpochRewardsLensAbi,
        address: lensAddress,
        functionName: 'systemState',
      })

      if (systemState.paused) {
        emitter.emit('claim-epoch-token-failed-validation', 'contract paused')
        return
      }

      // Case-insensitive: the registry is checksummed, and a lower-cased address would
      // otherwise look unregistered and refuse a claim the contract would honour.
      const isRegistered = systemState.tokens.some(
        registered => registered.toLowerCase() === token.toLowerCase(),
      )
      if (!isRegistered) {
        // Not in the contract's own list, so it cannot pay. Most likely a stale render.
        emitter.emit(
          'claim-epoch-token-failed-validation',
          'asset is not in the reward registry',
        )
        return
      }

      // One asset, so the epoch x token product reduces to the epoch bound, and there
      // is no registry page to overflow and no cursor to thread.
      const span = Math.max(1, Number(systemState.maxClaimEpochs))

      // Every chunk is a wallet prompt, so chunks that pay nothing are skipped. That
      // costs nothing - claiming is idempotent and an unresolved epoch stays claimable.
      //
      // Scanned with `preview`, which takes one token, rather than the Lens's
      // `claimableByToken`, which prices the whole registry: at (epochs x tokens) a
      // 64-epoch chunk against eight assets is 512 pairs, past a node's eth_call cap.
      // This action exists to rescue exactly that holder, so it must not scale with the
      // registry.
      //
      // Issued together rather than in a loop: the reads are independent and the app's
      // transport batches on a scheduler wait, which a serial loop pays once per chunk.
      // Measured 10.5s against the live Lens for nine chunks, versus 1.2s here.
      const candidates = chunksFor({ fromEpoch, span, toEpoch })
      const owedByChunk = await Promise.all(
        candidates.map(chunk =>
          readContract(publicClient, {
            abi: veHemiEpochRewardsAbi,
            address: rewardsAddress,
            args: [tokenId, holder, token, chunk.from, chunk.to],
            functionName: 'preview',
          }),
        ),
      )
      const payable = candidates.filter(
        (_unused, index) => owedByChunk[index] > BigInt(0),
      )

      if (payable.length === 0) {
        emitter.emit('nothing-to-claim')
        return
      }

      emitter.emit('pre-claim-epoch-token', {
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

        // Re-asserted per transaction, not once for the sequence. `claimToken` is
        // holder-only, and a wallet that switches chain or account midway would
        const maySign = await mayClaimChunk({
          chainId,
          chunk,
          emitter,
          holder,
          publicClient,
          rewardsAddress,
          token,
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
          args: [tokenId, holder, token, chunk.from, chunk.to],
          chain: walletClient.chain,
          functionName: 'claimToken',
        }).catch(function (error) {
          emitter.emit('user-signing-claim-epoch-token-error', error)
        })

        if (!hash) {
          return
        }

        emitter.emit('user-signed-claim-epoch-token-chunk', hash, progress)

        const receipt = await settleChunk({
          emitter,
          hash,
          progress,
          walletClient,
        })
        if (!receipt) {
          return
        }

        emitter.emit('claim-epoch-token-chunk-succeeded', receipt, progress)
      }
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-epoch-token-settled')
    }
  }

export const claimEpochRewardsToken = (
  ...args: Parameters<typeof runClaimToken>
) => toPromiseEvent<ClaimEpochRewardsTokenEvents>(runClaimToken(...args))
