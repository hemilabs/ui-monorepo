import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData, erc4626Abi } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import {
  allowance,
  approve,
  asset,
  balanceOf,
  deposit as vaultDeposit,
  maxDeposit,
} from 'viem-erc4626/actions'

import type { DepositEvents } from '../../types'

const canDepositToken = async function ({
  account,
  amount,
  assetAddress,
  vaultAddress,
  walletClient,
}: {
  account: Address
  amount: bigint
  assetAddress: Address
  vaultAddress: Address
  walletClient: WalletClient
}): Promise<{
  canDeposit: boolean
  reason?: string
}> {
  if (!amount || amount <= BigInt(0)) {
    return {
      canDeposit: false,
      reason: 'invalid amount',
    }
  }

  const [tokenBalance, maxAmountDeposit] = await Promise.all([
    balanceOf(walletClient, {
      account,
      address: assetAddress,
    }),
    maxDeposit(walletClient, {
      address: vaultAddress,
      receiver: account,
    }),
  ])

  if (tokenBalance < amount) {
    return {
      canDeposit: false,
      reason: 'insufficient balance',
    }
  }
  if (amount > maxAmountDeposit) {
    return {
      canDeposit: false,
      reason: 'amount exceeds max deposit limit',
    }
  }
  return { canDeposit: true }
}

const runDepositToken = ({
  account,
  amount,
  vaultAddress,
  walletClient,
}: {
  account: Address
  amount: bigint
  vaultAddress: Address
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<DepositEvents>) {
    try {
      // should always be defined, though
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      // Get the underlying asset address first
      const assetAddress = await asset(walletClient, {
        address: vaultAddress,
      })

      const { canDeposit: canDepositFlag, reason } = await canDepositToken({
        account,
        amount,
        assetAddress,
        vaultAddress,
        walletClient,
      }).catch(() => ({
        canDeposit: false,
        reason: 'failed to validate inputs',
      }))

      if (!canDepositFlag) {
        emitter.emit('deposit-failed-validation', reason!)
        return
      }

      // Check current allowance
      emitter.emit('check-allowance')
      const currentAllowance = await allowance(walletClient, {
        address: assetAddress,
        owner: account,
        spender: vaultAddress,
      })

      // If allowance is insufficient, approve first
      if (currentAllowance < amount) {
        emitter.emit('pre-approve')

        const approvalHash = await approve(walletClient, {
          address: assetAddress,
          amount,
          spender: vaultAddress,
        }).catch(function (error: Error) {
          emitter.emit('user-signing-approval-error', error)
        })

        if (!approvalHash) {
          return
        }

        emitter.emit('user-signed-approval', approvalHash)

        const approvalReceipt = await waitForTransactionReceipt(walletClient, {
          hash: approvalHash,
        }).catch(function (error: Error) {
          emitter.emit('deposit-failed', error)
        })

        if (!approvalReceipt) {
          return
        }

        if (approvalReceipt.status === 'reverted') {
          emitter.emit('approve-transaction-reverted', approvalReceipt)
          return
        }

        emitter.emit('approve-transaction-succeeded', approvalReceipt)
      }

      emitter.emit('pre-deposit')

      const depositHash = await vaultDeposit(walletClient, {
        address: vaultAddress,
        assets: amount,
        receiver: account,
      }).catch(function (error: Error) {
        emitter.emit('user-signing-deposit-error', error)
      })

      if (!depositHash) {
        return
      }

      emitter.emit('user-signed-deposit', depositHash)

      const depositReceipt = await waitForTransactionReceipt(walletClient, {
        hash: depositHash,
      }).catch(function (error: Error) {
        emitter.emit('deposit-failed', error)
      })

      if (!depositReceipt) {
        return
      }

      const depositEventMap: Record<
        TransactionReceipt['status'],
        keyof DepositEvents
      > = {
        reverted: 'deposit-transaction-reverted',
        success: 'deposit-transaction-succeeded',
      }

      emitter.emit(depositEventMap[depositReceipt.status], depositReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('deposit-settled')
    }
  }

export const depositToken = (...args: Parameters<typeof runDepositToken>) =>
  toPromiseEvent<DepositEvents>(runDepositToken(...args))

export const encodeDepositToken = ({
  amount,
  receiver,
}: {
  amount: bigint
  receiver: Address
}) =>
  encodeFunctionData({
    abi: erc4626Abi,
    args: [amount, receiver],
    functionName: 'deposit',
  })
