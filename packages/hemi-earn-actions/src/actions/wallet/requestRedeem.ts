import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { allowance, approve, balanceOf } from 'viem-erc20/actions'

import { routerAbi } from '../../abi'
import {
  getHemiEarnRouterAddress,
  getHemiEarnShareToken,
} from '../../constants'
import type { RequestRedeemEvents } from '../../types'
import { quoteRedeem } from '../public/quoteRedeem'

const canRequestRedeem = function ({
  shares,
  userShares,
}: {
  shares: bigint
  userShares: bigint
}): { canRedeem: boolean; reason?: string } {
  if (!shares || shares <= BigInt(0)) {
    return { canRedeem: false, reason: 'invalid shares amount' }
  }

  if (shares > userShares) {
    return { canRedeem: false, reason: 'insufficient shares balance' }
  }

  return { canRedeem: true }
}

const calculateAdjustedShares = function ({
  requestedShares,
  userShares,
}: {
  requestedShares: bigint
  userShares: bigint
}) {
  // Defense-in-depth: if upstream sized `requestedShares` wrong (e.g. parsed
  // with the wrong decimals), do not silently sweep to the full balance —
  // forward the bad value so it surfaces as an on-chain revert instead.
  if (requestedShares > userShares) {
    return requestedShares
  }
  // During withdraw operations, the requested shares may be very close to
  // (but not exactly) the user's balance due to rounding. If above 99.9% of
  // the balance, withdraw the full balance to avoid leaving dust behind.
  const threshold = (userShares * BigInt(999)) / BigInt(1000)
  if (requestedShares >= threshold) {
    return userShares
  }
  return requestedShares
}

const runRequestRedeem = ({
  account,
  asset,
  fulfillmentFee,
  receiver,
  routerAddress = getHemiEarnRouterAddress(),
  shares,
  shareToken = getHemiEarnShareToken(),
  walletClient,
}: {
  account: Address
  asset: Address
  fulfillmentFee: bigint
  receiver: Address
  routerAddress?: Address
  shares: bigint
  shareToken?: Address
  walletClient: WalletClient
}) =>
  // eslint-disable-next-line complexity -- linear redeem workflow with branching event emissions
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      const userShares = await balanceOf(walletClient, {
        account,
        address: shareToken,
      }).catch(() => BigInt(-1))

      if (userShares < BigInt(0)) {
        emitter.emit('withdraw-failed-validation', 'failed to validate inputs')
        return
      }

      const { canRedeem, reason } = canRequestRedeem({ shares, userShares })

      if (!canRedeem) {
        emitter.emit('withdraw-failed-validation', reason!)
        return
      }

      const adjustedShares = calculateAdjustedShares({
        requestedShares: shares,
        userShares,
      })

      emitter.emit('pre-quote')
      const nativeFee = await quoteRedeem({
        asset,
        client: walletClient,
        fulfillmentFee,
        routerAddress,
        shares: adjustedShares,
      }).catch(function (error) {
        emitter.emit('quote-failed', error)
      })

      if (nativeFee === undefined) {
        return
      }
      emitter.emit('quote-succeeded', nativeFee)

      emitter.emit('check-allowance')
      const currentAllowance = await allowance(walletClient, {
        address: shareToken,
        owner: account,
        spender: routerAddress,
      })

      if (currentAllowance < adjustedShares) {
        emitter.emit('pre-approve')

        const approvalHash = await approve(walletClient, {
          address: shareToken,
          amount: adjustedShares,
          spender: routerAddress,
        }).catch(function (error) {
          emitter.emit('user-signing-approval-error', error)
        })

        if (!approvalHash) {
          return
        }

        emitter.emit('user-signed-approval', approvalHash)

        const approvalReceipt = await waitForTransactionReceipt(walletClient, {
          hash: approvalHash,
        }).catch(function (error) {
          emitter.emit('withdraw-failed', error)
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

      emitter.emit('pre-withdraw')

      const withdrawHash = await writeContract(walletClient, {
        abi: routerAbi,
        account,
        address: routerAddress,
        args: [asset, adjustedShares, receiver, true, fulfillmentFee],
        chain: walletClient.chain,
        functionName: 'requestRedeem',
        value: nativeFee,
      }).catch(function (error) {
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
        keyof RequestRedeemEvents
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

export const requestRedeem = (...args: Parameters<typeof runRequestRedeem>) =>
  toPromiseEvent<RequestRedeemEvents>(runRequestRedeem(...args))
