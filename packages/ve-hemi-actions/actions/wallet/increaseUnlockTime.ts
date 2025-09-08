import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'
import type { IncreaseUnlockTimeEvents } from '../../types'
import { toPromiseEvent, validateIncreaseUnlockTimeInputs } from '../../utils'
import { getLockedBalance } from '../public/veHemi'

const canIncreaseUnlockTime = async function ({
  account,
  lockDurationInSeconds,
  tokenId,
  walletClient,
}: {
  account: Address
  lockDurationInSeconds: number
  tokenId: bigint
  walletClient: WalletClient
}): Promise<{
  canIncrease: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canIncrease: false,
      reason: 'wallet client chain is not defined',
    }
  }

  const reason = validateIncreaseUnlockTimeInputs({
    account,
    chainId: walletClient.chain.id,
    lockDurationInSeconds,
    tokenId,
  })
  if (reason) {
    return { canIncrease: false, reason }
  }

  try {
    // Check if lock exists and is not expired
    const { amount, end } = await getLockedBalance(walletClient, tokenId)
    const now = BigInt(Math.floor(Date.now() / 1000))

    if (amount <= 0) {
      return { canIncrease: false, reason: 'no existing lock' }
    }

    if (end <= now) {
      return { canIncrease: false, reason: 'lock already expired' }
    }

    // Check if new duration would actually extend the lock
    const newUnlockTime = now + BigInt(lockDurationInSeconds)
    if (newUnlockTime <= end) {
      return {
        canIncrease: false,
        reason: 'new unlock time must be greater than current unlock time',
      }
    }

    return { canIncrease: true }
  } catch {
    return { canIncrease: false, reason: 'failed to check lock status' }
  }
}

const runIncreaseUnlockTime = ({
  account,
  lockDurationInSeconds,
  tokenId,
  walletClient,
}: {
  account: Address
  lockDurationInSeconds: number
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<IncreaseUnlockTimeEvents>) {
    try {
      const { canIncrease, reason } = await canIncreaseUnlockTime({
        account,
        lockDurationInSeconds,
        tokenId,
        walletClient,
      }).catch(() => ({
        canIncrease: false,
        reason: 'failed to validate inputs',
      }))

      if (!canIncrease) {
        emitter.emit('increase-unlock-time-failed-validation', reason!)
        return
      }

      const veHemiAddress = getVeHemiContractAddress(walletClient.chain!.id)

      emitter.emit('pre-increase-unlock-time')

      const increaseHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [tokenId, BigInt(lockDurationInSeconds)],
        chain: walletClient.chain,
        functionName: 'increaseUnlockTime',
      }).catch(function (error) {
        emitter.emit('user-signing-increase-unlock-time-error', error)
      })

      if (!increaseHash) {
        return
      }

      emitter.emit('user-signed-increase-unlock-time', increaseHash)

      const increaseReceipt = await waitForTransactionReceipt(walletClient, {
        hash: increaseHash,
      }).catch(function (error) {
        emitter.emit('increase-unlock-time-failed', error)
      })

      if (!increaseReceipt) {
        return
      }

      const increaseEventMap: Record<
        TransactionReceipt['status'],
        keyof IncreaseUnlockTimeEvents
      > = {
        reverted: 'increase-unlock-time-transaction-reverted',
        success: 'increase-unlock-time-transaction-succeeded',
      }

      emitter.emit(increaseEventMap[increaseReceipt.status], increaseReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('increase-unlock-time-settled')
    }
  }

export const increaseUnlockTime = (
  ...args: Parameters<typeof runIncreaseUnlockTime>
) => toPromiseEvent<IncreaseUnlockTimeEvents>(runIncreaseUnlockTime(...args))

/**
 * Encode the increaseUnlockTime function call for batch operations
 */
export const encodeIncreaseUnlockTime = ({
  lockDurationInSeconds,
  tokenId,
}: {
  tokenId: bigint
  lockDurationInSeconds: bigint
}) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [tokenId, lockDurationInSeconds],
    functionName: 'increaseUnlockTime',
  })
