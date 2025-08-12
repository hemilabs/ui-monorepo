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
import type { CreateLockEvents } from '../../types'
import { toPromiseEvent, validateCreateLockInputs } from '../../utils'
import { getHemiTokenAddress } from '../public/veHemi'

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
  lockDurationInSeconds: bigint
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
  lockDurationInSeconds: bigint
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
          return
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
          return
        }

        const approveEventMap: Record<
          TransactionReceipt['status'],
          keyof CreateLockEvents
        > = {
          reverted: 'approve-transaction-reverted',
          success: 'approve-transaction-succeeded',
        }

        emitter.emit(approveEventMap[approveReceipt.status], approveReceipt)

        if (approveReceipt.status !== 'success') {
          return
        }
      }

      emitter.emit('pre-lock-creation')

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const lockHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [amount, lockDurationInSeconds],
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
