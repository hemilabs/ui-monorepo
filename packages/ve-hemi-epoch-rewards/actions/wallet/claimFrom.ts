import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from 'viem'
import { simulateContract, writeContract } from 'viem/actions'

import { getVeHemiEpochRewardsContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsAbi } from '../../rewardsAbi.ts'
import type { ClaimFromEvents } from '../../types.ts'
import { validateClaimFromInputs } from '../../utils.ts'

import { waitForSettlement } from './waitForSettlement.ts'

type ClaimFromParameters = {
  account: Address
  fromEpoch: number
  toEpoch: number
  tokenId: bigint
  tokenStart: bigint
  walletClient: WalletClient
}

const canRunClaimFrom = async function ({
  account,
  fromEpoch,
  toEpoch,
  tokenId,
  tokenStart,
  walletClient,
}: ClaimFromParameters): Promise<{
  canClaim: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canClaim: false,
      reason: 'wallet client chain is not defined',
    }
  }

  const reason = validateClaimFromInputs({
    account,
    fromEpoch,
    toEpoch,
    tokenId,
    tokenStart,
  })
  if (reason) {
    return { canClaim: false, reason }
  }

  return { canClaim: true }
}

const runClaimFrom = ({
  account,
  fromEpoch,
  toEpoch,
  tokenId,
  tokenStart,
  walletClient,
}: ClaimFromParameters) =>
  async function (emitter: EventEmitter<ClaimFromEvents>) {
    try {
      const { canClaim, reason } = await canRunClaimFrom({
        account,
        fromEpoch,
        toEpoch,
        tokenId,
        tokenStart,
        walletClient,
      }).catch(() => ({
        canClaim: false,
        reason: 'failed to validate inputs',
      }))

      if (!canClaim) {
        emitter.emit('claim-from-failed-validation', reason!)
        return
      }

      const rewardsAddress = getVeHemiEpochRewardsContractAddress(
        walletClient.chain!.id,
      )

      const args = [tokenId, account, fromEpoch, toEpoch, tokenStart] as const

      // A transaction gives back no return value, so the registry cursor
      // `claimFrom` returns can only be read by simulating the same call.
      const simulation = await simulateContract(walletClient, {
        abi: veHemiEpochRewardsAbi,
        account,
        address: rewardsAddress,
        args,
        chain: walletClient.chain,
        functionName: 'claimFrom',
      }).catch(function (error) {
        emitter.emit('claim-from-failed', error)
      })

      if (!simulation) {
        return
      }

      if (simulation.result !== BigInt(0)) {
        emitter.emit(
          'claim-from-failed-validation',
          'the claim would not settle every reward token',
        )
        return
      }

      emitter.emit('pre-claim-from')

      const claimHash = await writeContract(walletClient, {
        abi: veHemiEpochRewardsAbi,
        account,
        address: rewardsAddress,
        args,
        chain: walletClient.chain,
        functionName: 'claimFrom',
      }).catch(function (error) {
        emitter.emit('user-signing-claim-from-error', error)
      })

      if (!claimHash) {
        return
      }

      emitter.emit('user-signed-claim-from', claimHash)

      const settlement = await waitForSettlement(walletClient, claimHash).catch(
        function (error) {
          emitter.emit('claim-from-failed', error)
        },
      )

      if (!settlement) {
        return
      }

      if (settlement.outcome === 'cancelled') {
        emitter.emit(
          'user-signing-claim-from-error',
          new Error('the claim was cancelled in the wallet'),
        )
        return
      }
      if (settlement.outcome === 'replaced') {
        emitter.emit(
          'claim-from-failed',
          new Error(
            'the claim was replaced in the wallet by another transaction',
          ),
        )
        return
      }

      const claimReceipt = settlement.receipt

      const claimEventMap: Record<
        TransactionReceipt['status'],
        keyof ClaimFromEvents
      > = {
        reverted: 'claim-from-transaction-reverted',
        success: 'claim-from-transaction-succeeded',
      }

      emitter.emit(claimEventMap[claimReceipt.status], claimReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-from-settled')
    }
  }

export const claimFrom = (...args: Parameters<typeof runClaimFrom>) =>
  toPromiseEvent<ClaimFromEvents>(runClaimFrom(...args))

/**
 * Encode the claimFrom function call for batch operations
 */
export const encodeClaimFrom = ({
  account,
  fromEpoch,
  toEpoch,
  tokenId,
  tokenStart,
}: Omit<ClaimFromParameters, 'walletClient'>) =>
  encodeFunctionData({
    abi: veHemiEpochRewardsAbi,
    args: [tokenId, account, fromEpoch, toEpoch, tokenStart],
    functionName: 'claimFrom',
  })
