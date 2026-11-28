import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'

import { veHemiAbi } from '../../abi.ts'
import { getVeHemiContractAddress } from '../../constants.ts'
import type { IncreaseAmountEvents } from '../../types.ts'
import { unixNowTimestamp, validateIncreaseAmountInputs } from '../../utils.ts'
import {
  getAutoRelockStatus,
  getLockedBalance,
  memoizedGetHemiTokenAddress,
} from '../public/veHemi.ts'

import { handleApproval } from './approval.ts'

const canIncreaseAmount = async function ({
  account,
  additionalAmount,
  approvalAdditionalAmount,
  autoRelockSupported,
  tokenId,
  walletClient,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
  autoRelockSupported: boolean
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

  const reason = validateIncreaseAmountInputs({
    account,
    additionalAmount,
    approvalAdditionalAmount,
    chainId: walletClient.chain.id,
    tokenId,
  })
  if (reason) {
    return { canIncrease: false, reason }
  }

  try {
    const hemiTokenAddress = await memoizedGetHemiTokenAddress(walletClient)
    const tokenBalance = await balanceOf(walletClient, {
      account,
      address: hemiTokenAddress,
    })

    if (additionalAmount > tokenBalance) {
      return { canIncrease: false, reason: 'insufficient balance' }
    }

    const lockEnd = autoRelockSupported
      ? (await getAutoRelockStatus(walletClient, [tokenId]))[0].effectiveLockEnd
      : (await getLockedBalance(walletClient, tokenId)).end
    const now = unixNowTimestamp()
    if (lockEnd <= now) {
      return { canIncrease: false, reason: 'lock already expired' }
    }

    return { canIncrease: true }
  } catch {
    return { canIncrease: false, reason: 'failed to check balance' }
  }
}

const runIncreaseAmount = ({
  account,
  additionalAmount,
  approvalAdditionalAmount,
  autoRelockSupported,
  tokenId,
  walletClient,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
  autoRelockSupported: boolean
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<IncreaseAmountEvents>) {
    try {
      const { canIncrease, reason } = await canIncreaseAmount({
        account,
        additionalAmount,
        approvalAdditionalAmount,
        autoRelockSupported,
        tokenId,
        walletClient,
      }).catch(() => ({
        canIncrease: false,
        reason: 'failed to validate inputs',
      }))

      if (!canIncrease) {
        emitter.emit('increase-amount-failed-validation', reason!)
        return
      }

      const veHemiAddress = getVeHemiContractAddress(walletClient.chain!.id)
      const hemiTokenAddress = await memoizedGetHemiTokenAddress(walletClient)

      const approved = await handleApproval({
        account,
        amount: additionalAmount,
        approvalAmount: approvalAdditionalAmount,
        emitter,
        hemiTokenAddress,
        veHemiAddress,
        walletClient,
      })

      if (!approved) {
        return
      }

      emitter.emit('pre-increase-amount')

      const increaseHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [tokenId, additionalAmount],
        chain: walletClient.chain,
        functionName: 'increaseAmount',
      }).catch(function (error) {
        emitter.emit('user-signing-increase-amount-error', error)
      })

      if (!increaseHash) {
        return
      }

      emitter.emit('user-signed-increase-amount', increaseHash)

      const increaseReceipt = await waitForTransactionReceipt(walletClient, {
        hash: increaseHash,
      }).catch(function (error) {
        emitter.emit('increase-amount-failed', error)
      })

      if (!increaseReceipt) {
        return
      }

      const increaseEventMap: Record<
        TransactionReceipt['status'],
        keyof IncreaseAmountEvents
      > = {
        reverted: 'increase-amount-transaction-reverted',
        success: 'increase-amount-transaction-succeeded',
      }

      emitter.emit(increaseEventMap[increaseReceipt.status], increaseReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('increase-amount-settled')
    }
  }

export const increaseAmount = (...args: Parameters<typeof runIncreaseAmount>) =>
  toPromiseEvent<IncreaseAmountEvents>(runIncreaseAmount(...args))

/**
 * Encode the increaseAmount function call for batch operations
 */
export const encodeIncreaseAmount = ({
  amount,
  tokenId,
}: {
  amount: bigint
  tokenId: bigint
}) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [tokenId, amount],
    functionName: 'increaseAmount',
  })
