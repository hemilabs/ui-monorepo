import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { getErc20TokenBalance } from 'viem-erc20/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'
import type { CreateLockEvents } from '../../types'
import { toPromiseEvent, validateCreateLockInputs } from '../../utils'
import { memoizedGetHemiTokenAddress } from '../public/veHemi'

import { handleApproval } from './approval'

const canCreateLock = async function ({
  account,
  amount,
  approvalAmount,
  lockDurationInSeconds,
  walletClient,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  lockDurationInSeconds: number
  walletClient: WalletClient
}): Promise<{
  canCreate: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canCreate: false,
      reason: 'wallet client chain is not defined',
    }
  }

  const reason = validateCreateLockInputs({
    account,
    amount,
    approvalAmount,
    chainId: walletClient.chain.id,
    lockDurationInSeconds,
  })
  if (reason) {
    return { canCreate: false, reason }
  }

  try {
    const hemiTokenAddress = await memoizedGetHemiTokenAddress(walletClient)
    const tokenBalance = await getErc20TokenBalance(walletClient, {
      account,
      address: hemiTokenAddress,
    })

    if (amount > tokenBalance) {
      return { canCreate: false, reason: 'insufficient balance' }
    }

    return { canCreate: true }
  } catch {
    return { canCreate: false, reason: 'failed to check balance' }
  }
}

const runCreateLock = ({
  account,
  amount,
  approvalAmount,
  lockDurationInSeconds,
  walletClient,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  lockDurationInSeconds: number
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<CreateLockEvents>) {
    try {
      const { canCreate, reason } = await canCreateLock({
        account,
        amount,
        approvalAmount,
        lockDurationInSeconds,
        walletClient,
      }).catch(() => ({
        canCreate: false,
        reason: 'failed to validate inputs',
      }))

      if (!canCreate) {
        // reason must be defined because canCreate is false
        emitter.emit('lock-creation-failed-validation', reason!)
        return
      }

      const veHemiAddress = getVeHemiContractAddress(walletClient.chain!.id)
      const hemiTokenAddress = await memoizedGetHemiTokenAddress(walletClient)

      const approved = await handleApproval({
        account,
        amount,
        approvalAmount,
        emitter,
        hemiTokenAddress,
        veHemiAddress,
        walletClient,
      })

      if (!approved) {
        return
      }

      emitter.emit('pre-lock-creation')

      const lockHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [amount, BigInt(lockDurationInSeconds)],
        chain: walletClient.chain,
        functionName: 'createLock',
      }).catch(function (error) {
        emitter.emit('user-signing-lock-creation-error', error)
      })

      if (!lockHash) {
        return
      }

      emitter.emit('user-signed-lock-creation', lockHash)

      const lockReceipt = await waitForTransactionReceipt(walletClient, {
        hash: lockHash,
      }).catch(function (error) {
        emitter.emit('lock-creation-failed', error)
      })

      if (!lockReceipt) {
        return
      }

      const lockEventMap: Record<
        TransactionReceipt['status'],
        keyof CreateLockEvents
      > = {
        reverted: 'lock-creation-transaction-reverted',
        success: 'lock-creation-transaction-succeeded',
      }

      emitter.emit(lockEventMap[lockReceipt.status], lockReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('lock-creation-settled')
    }
  }

export const createLock = (...args: Parameters<typeof runCreateLock>) =>
  toPromiseEvent<CreateLockEvents>(runCreateLock(...args))

/**
 * Encode the createLock function call for batch operations
 */
export const encodeCreateLock = ({
  amount,
  lockDurationInSeconds,
}: {
  amount: bigint
  lockDurationInSeconds: bigint
}) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [amount, lockDurationInSeconds],
    functionName: 'createLock',
  })
