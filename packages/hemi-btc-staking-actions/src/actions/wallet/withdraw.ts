import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { balanceOf, redeem } from 'viem-erc4626/actions'

import { yieldVaultAbi } from '../../abi'
import { getBtcStakingVaultContractAddress } from '../../constants'
import type { WithdrawEvents } from '../../types'

const canWithdraw = async function ({
  shares,
  userShares,
}: {
  shares: bigint
  userShares: bigint
}): Promise<{
  canWithdraw: boolean
  reason?: string
}> {
  if (!shares || shares <= BigInt(0)) {
    return {
      canWithdraw: false,
      reason: 'invalid shares amount',
    }
  }

  if (shares > userShares) {
    return {
      canWithdraw: false,
      reason: 'insufficient shares balance',
    }
  }

  return { canWithdraw: true }
}

const calculateAdjustedShares = function ({
  requestedShares,
  userShares,
}: {
  requestedShares: bigint
  userShares: bigint
}) {
  // During withdraw operations, the token amount to withdraw may be too close
  // but not be the exact user's balance due to rounding issues. If this is the
  // case, assume the desired amount is the balance and not the given amount.
  // This prevents small amounts (dust) to remain in the user's balance.
  //
  // If the token amount is above 99.9% of the balance, the whole
  // balance will be returned instead of the given amount.
  const threshold = (userShares * BigInt(999)) / BigInt(1000)
  if (requestedShares >= threshold) {
    return userShares
  }

  return requestedShares
}

const runWithdraw = ({
  account,
  owner,
  receiver,
  shares,
  walletClient,
}: {
  account: Address
  owner: Address
  receiver: Address
  shares: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<WithdrawEvents>) {
    try {
      // should always be defined, though
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      const vaultAddress = getBtcStakingVaultContractAddress(
        walletClient.chain.id,
      )

      // Memoize the balanceOf call to use it for both validation and dust sweeping
      const userShares = await balanceOf(walletClient, {
        account,
        address: vaultAddress,
      })

      const { canWithdraw: canWithdrawFlag, reason } = await canWithdraw({
        shares,
        userShares,
      }).catch(() => ({
        canWithdraw: false,
        reason: 'failed to validate inputs',
      }))

      if (!canWithdrawFlag) {
        emitter.emit('withdraw-failed-validation', reason!)
        return
      }

      emitter.emit('pre-withdraw')

      // Calculate adjusted shares for dust sweeping
      const adjustedShares = calculateAdjustedShares({
        requestedShares: shares,
        userShares,
      })

      const withdrawHash = await redeem(walletClient, {
        address: vaultAddress,
        owner,
        receiver,
        shares: adjustedShares,
      }).catch(function (error: Error) {
        emitter.emit('user-signing-withdraw-error', error)
      })

      if (!withdrawHash) {
        return
      }

      emitter.emit('user-signed-withdraw', withdrawHash)

      const withdrawReceipt = await waitForTransactionReceipt(walletClient, {
        hash: withdrawHash,
      }).catch(function (error) {
        emitter.emit('withdraw-failed', error)
      })

      if (!withdrawReceipt) {
        return
      }

      const withdrawEventMap: Record<
        TransactionReceipt['status'],
        keyof WithdrawEvents
      > = {
        reverted: 'withdraw-transaction-reverted',
        success: 'withdraw-transaction-succeeded',
      }

      emitter.emit(withdrawEventMap[withdrawReceipt.status], withdrawReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('withdraw-settled')
    }
  }

export const withdraw = (...args: Parameters<typeof runWithdraw>) =>
  toPromiseEvent<WithdrawEvents>(runWithdraw(...args))

/**
 * Encode the redeem function call for batch operations
 */
export const encodeWithdraw = ({
  owner,
  receiver,
  shares,
}: {
  owner: Address
  receiver: Address
  shares: bigint
}) =>
  encodeFunctionData({
    abi: yieldVaultAbi,
    args: [shares, receiver, owner],
    functionName: 'redeem',
  })
