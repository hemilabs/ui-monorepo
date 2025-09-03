import { EventEmitter } from 'events'
import pMemoize from 'promise-mem'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import {
  approveErc20Token,
  getErc20TokenAllowance,
  getErc20TokenBalance,
} from 'viem-erc20/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'
import type {
  ApprovalEvents,
  CreateLockEvents,
  IncreaseAmountEvents,
} from '../../types'
import {
  toPromiseEvent,
  validateCreateLockInputs,
  validateIncreaseAmountInputs,
} from '../../utils'
import { getHemiTokenAddress, getLockedBalance } from '../public/veHemi'

type DefaultEventMap = [never]
type EventMap<T> = Record<keyof T, unknown[]> | DefaultEventMap

const memoizedGetHemiTokenAddress = pMemoize(getHemiTokenAddress, {
  resolver: w => w.chain?.id,
})

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
    const tokenBalance = await memoizedGetHemiTokenAddress(walletClient).then(
      hemiTokenAddress =>
        // Using @ts-expect-error fails to compile so I need to use @ts-ignore
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
        getErc20TokenBalance(walletClient, {
          account,
          address: hemiTokenAddress,
        }),
    )

    if (amount > tokenBalance) {
      return { canCreate: false, reason: 'insufficient balance' }
    }

    return { canCreate: true }
  } catch {
    return { canCreate: false, reason: 'failed to check balance' }
  }
}

const canIncreaseAmount = async function ({
  account,
  additionalAmount,
  approvalAdditionalAmount,
  tokenId,
  walletClient,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
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
    const tokenBalance = await memoizedGetHemiTokenAddress(walletClient).then(
      hemiTokenAddress =>
        // Using @ts-expect-error fails to compile so I need to use @ts-ignore
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
        getErc20TokenBalance(walletClient, {
          account,
          address: hemiTokenAddress,
        }),
    )

    if (additionalAmount > tokenBalance) {
      return { canIncrease: false, reason: 'insufficient balance' }
    }

    // check if lock is expired
    // if expired, cannot increase amount
    const { end } = await getLockedBalance(walletClient, tokenId)
    const now = BigInt(Math.floor(Date.now() / 1000))
    if (end <= now) {
      return { canIncrease: false, reason: 'lock already expired' }
    }

    return { canIncrease: true }
  } catch {
    return { canIncrease: false, reason: 'failed to check balance' }
  }
}

const handleApproval = async function <T extends ApprovalEvents>({
  account,
  amount,
  approvalAmount,
  emitter,
  hemiTokenAddress,
  veHemiAddress,
  walletClient,
}: {
  account: Address
  amount: bigint
  approvalAmount?: bigint
  emitter: EventEmitter<EventMap<T>>
  hemiTokenAddress: Address
  veHemiAddress: Address
  walletClient: WalletClient
}): Promise<boolean> {
  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  const allowance = await getErc20TokenAllowance(walletClient, {
    address: hemiTokenAddress,
    owner: account,
    spender: veHemiAddress,
  })

  if (amount > allowance) {
    emitter.emit('pre-approve')

    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
    const approveHash = await approveErc20Token(walletClient, {
      address: hemiTokenAddress,
      amount: approvalAmount ?? amount,
      spender: veHemiAddress,
    }).catch(function (error) {
      emitter.emit('user-signing-approve-error', error)
    })

    if (!approveHash) {
      return false
    }

    emitter.emit('user-signed-approve', approveHash)

    // Using @ts-expect-error fails to compile so I need to use @ts-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
    const approveReceipt = await waitForTransactionReceipt(walletClient, {
      hash: approveHash,
    }).catch(function (error) {
      emitter.emit('approve-failed', error)
    })

    if (!approveReceipt) {
      return false
    }

    const approveEventMap: Record<
      TransactionReceipt['status'],
      keyof ApprovalEvents
    > = {
      reverted: 'approve-transaction-reverted',
      success: 'approve-transaction-succeeded',
    }

    emitter.emit(approveEventMap[approveReceipt.status], approveReceipt)

    if (approveReceipt.status !== 'success') {
      return false
    }
  }

  return true
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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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

const runIncreaseAmount = ({
  account,
  additionalAmount,
  approvalAdditionalAmount,
  tokenId,
  walletClient,
}: {
  account: Address
  additionalAmount: bigint
  approvalAdditionalAmount?: bigint
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<IncreaseAmountEvents>) {
    try {
      const { canIncrease, reason } = await canIncreaseAmount({
        account,
        additionalAmount,
        approvalAdditionalAmount,
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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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
  tokenId: bigint
  amount: bigint
}) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [tokenId, amount],
    functionName: 'increaseAmount',
  })
