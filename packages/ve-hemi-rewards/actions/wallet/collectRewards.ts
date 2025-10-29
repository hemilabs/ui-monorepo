import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { veHemiRewardsAbi } from '../../abi'
import { getVeHemiRewardsContractAddress } from '../../constants'
import type { CollectAllRewardsEvents } from '../../types'
import { toPromiseEvent } from '../../utils'

const canCollectAllRewards = async function ({
  tokenId,
  walletClient,
}: {
  tokenId: bigint
  walletClient: WalletClient
}): Promise<{
  canCollect: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canCollect: false,
      reason: 'wallet client chain is not defined',
    }
  }

  if (!tokenId || tokenId <= BigInt(0)) {
    return {
      canCollect: false,
      reason: 'invalid token id',
    }
  }

  return { canCollect: true }
}

const runCollectAllRewards = ({
  account,
  addToPositionBPS = BigInt(0),
  tokenId,
  walletClient,
}: {
  account: Address
  addToPositionBPS?: bigint
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<CollectAllRewardsEvents>) {
    try {
      const { canCollect, reason } = await canCollectAllRewards({
        tokenId,
        walletClient,
      }).catch(() => ({
        canCollect: false,
        reason: 'failed to validate inputs',
      }))

      if (!canCollect) {
        emitter.emit('collect-all-rewards-failed-validation', reason!)
        return
      }

      const veHemiRewardsAddress = getVeHemiRewardsContractAddress(
        walletClient.chain!.id,
      )

      emitter.emit('pre-collect-all-rewards')

      const collectHash = await writeContract(walletClient, {
        abi: veHemiRewardsAbi,
        account,
        address: veHemiRewardsAddress,
        args: [tokenId, addToPositionBPS],
        chain: walletClient.chain,
        functionName: 'collectAllRewards',
      }).catch(function (error) {
        emitter.emit('user-signing-collect-all-rewards-error', error)
      })

      if (!collectHash) {
        return
      }

      emitter.emit('user-signed-collect-all-rewards', collectHash)

      const collectReceipt = await waitForTransactionReceipt(walletClient, {
        hash: collectHash,
      }).catch(function (error) {
        emitter.emit('collect-all-rewards-failed', error)
      })

      if (!collectReceipt) {
        return
      }

      const collectEventMap: Record<
        TransactionReceipt['status'],
        keyof CollectAllRewardsEvents
      > = {
        reverted: 'collect-all-rewards-transaction-reverted',
        success: 'collect-all-rewards-transaction-succeeded',
      }

      emitter.emit(collectEventMap[collectReceipt.status], collectReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('collect-all-rewards-settled')
    }
  }

export const collectAllRewards = (
  ...args: Parameters<typeof runCollectAllRewards>
) => toPromiseEvent<CollectAllRewardsEvents>(runCollectAllRewards(...args))

/**
 * Encode the collectAllRewards function call for batch operations
 */
export const encodeCollectAllRewards = ({
  addToPositionBPS,
  tokenId,
}: {
  addToPositionBPS: bigint
  tokenId: bigint
}) =>
  encodeFunctionData({
    abi: veHemiRewardsAbi,
    args: [tokenId, addToPositionBPS],
    functionName: 'collectAllRewards',
  })
