import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { veHemiAbi } from '../../abi.ts'
import {
  getVeHemiContractAddress,
  MinLockDurationSeconds,
  snapToEpoch,
} from '../../constants.ts'
import type { AutoRelockEvents } from '../../types.ts'
import { validateToggleAutoRelockInputs } from '../../utils.ts'
import { getAutoRelockStatus, getOwnerOf } from '../public/veHemi.ts'

const toToggleRefusal = function ({
  enable,
  status,
}: {
  enable: boolean
  status: { effectiveLockEnd: bigint; isAutoRelockEnabled: boolean }
}) {
  if (enable && status.isAutoRelockEnabled) {
    return 'auto-relock already enabled'
  }

  if (!enable && !status.isAutoRelockEnabled) {
    return 'auto-relock not enabled'
  }

  if (enable) {
    const now = Math.floor(Date.now() / 1000)
    if (status.effectiveLockEnd <= BigInt(now)) {
      return 'lock expired'
    }

    const floor = BigInt(snapToEpoch(now) + MinLockDurationSeconds)
    if (status.effectiveLockEnd < floor) {
      return 'lock too short for auto-relock'
    }
  }

  return undefined
}

const canRunToggleAutoRelock = async function ({
  account,
  enable,
  tokenId,
  walletClient,
}: {
  account: Address
  enable: boolean
  tokenId: bigint
  walletClient: WalletClient
}): Promise<{
  canToggle: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canToggle: false,
      reason: 'wallet client chain is not defined',
    }
  }

  const reason = validateToggleAutoRelockInputs({
    account,
    chainId: walletClient.chain.id,
    tokenId,
  })
  if (reason) {
    return { canToggle: false, reason }
  }

  try {
    const [owner, [status]] = await Promise.all([
      getOwnerOf(walletClient, tokenId),
      getAutoRelockStatus(walletClient, [tokenId]),
    ])

    if (owner.toLowerCase() !== account.toLowerCase()) {
      return { canToggle: false, reason: 'not token owner' }
    }

    const refusal = toToggleRefusal({ enable, status })
    if (refusal) {
      return { canToggle: false, reason: refusal }
    }

    return { canToggle: true }
  } catch {
    return { canToggle: false, reason: 'failed to check lock status' }
  }
}

const runToggleAutoRelock = ({
  account,
  enable,
  tokenId,
  walletClient,
}: {
  account: Address
  enable: boolean
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<AutoRelockEvents>) {
    try {
      const { canToggle, reason } = await canRunToggleAutoRelock({
        account,
        enable,
        tokenId,
        walletClient,
      }).catch(() => ({
        canToggle: false,
        reason: 'failed to validate inputs',
      }))

      if (!canToggle) {
        emitter.emit('auto-relock-failed-validation', reason!)
        return
      }

      const veHemiAddress = getVeHemiContractAddress(walletClient.chain!.id)

      emitter.emit('pre-auto-relock')

      const toggleHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [tokenId],
        chain: walletClient.chain,
        functionName: enable ? 'enableAutoRelock' : 'disableAutoRelock',
      }).catch(function (error) {
        emitter.emit('user-signing-auto-relock-error', error)
      })

      if (!toggleHash) {
        return
      }

      emitter.emit('user-signed-auto-relock', toggleHash)

      const toggleReceipt = await waitForTransactionReceipt(walletClient, {
        hash: toggleHash,
      }).catch(function (error) {
        emitter.emit('auto-relock-failed', error)
      })

      if (!toggleReceipt) {
        return
      }

      const toggleEventMap: Record<
        TransactionReceipt['status'],
        keyof AutoRelockEvents
      > = {
        reverted: 'auto-relock-transaction-reverted',
        success: 'auto-relock-transaction-succeeded',
      }

      emitter.emit(toggleEventMap[toggleReceipt.status], toggleReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('auto-relock-settled')
    }
  }

export const toggleAutoRelock = (
  ...args: Parameters<typeof runToggleAutoRelock>
) => toPromiseEvent<AutoRelockEvents>(runToggleAutoRelock(...args))

/**
 * Encode the auto-relock toggle call for batch operations
 */
export const encodeToggleAutoRelock = ({
  enable,
  tokenId,
}: {
  enable: boolean
  tokenId: bigint
}) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [tokenId],
    functionName: enable ? 'enableAutoRelock' : 'disableAutoRelock',
  })
