import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { allowance, approve, balanceOf } from 'viem-erc20/actions'

import { getHemiEarnRouterAddress } from '../../constants.ts'
import { routerAbi } from '../../routerAbi.ts'
import type { RequestDepositEvents } from '../../types.ts'
import { quoteDeposit } from '../public/quoteDeposit.ts'

const canRequestDeposit = async function ({
  account,
  amount,
  asset,
  walletClient,
}: {
  account: Address
  amount: bigint
  asset: Address
  walletClient: WalletClient
}): Promise<{ canDeposit: boolean; reason?: string }> {
  if (!amount || amount <= BigInt(0)) {
    return { canDeposit: false, reason: 'invalid amount' }
  }

  const tokenBalance = await balanceOf(walletClient, {
    account,
    address: asset,
  })

  if (tokenBalance < amount) {
    return { canDeposit: false, reason: 'insufficient balance' }
  }

  return { canDeposit: true }
}

const runRequestDeposit = ({
  account,
  amount,
  asset,
  callbackFee,
  operator,
  receiver,
  routerAddress = getHemiEarnRouterAddress(),
  sharesOutMin = BigInt(0),
  walletClient,
}: {
  account: Address
  amount: bigint
  asset: Address
  callbackFee: bigint
  // Authorized to call Agent.cancel on the remote chain; reverts if 0x0.
  operator: Address
  receiver: Address
  routerAddress?: Address
  // Min shares accepted on fulfillment (slippage, enforced remotely); 0n disables it.
  sharesOutMin?: bigint
  walletClient: WalletClient
}) =>
  // eslint-disable-next-line complexity -- linear request workflow with branching event emissions
  async function (emitter: EventEmitter<RequestDepositEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      const { canDeposit, reason } = await canRequestDeposit({
        account,
        amount,
        asset,
        walletClient,
      }).catch(() => ({
        canDeposit: false,
        reason: 'failed to validate inputs',
      }))

      if (!canDeposit) {
        emitter.emit('deposit-failed-validation', reason!)
        return
      }

      emitter.emit('pre-quote')
      const nativeFee = await quoteDeposit({
        asset,
        assets: amount,
        callbackFee,
        client: walletClient,
        routerAddress,
      }).catch(function (error) {
        emitter.emit('quote-failed', error)
      })

      if (nativeFee === undefined) {
        return
      }
      emitter.emit('quote-succeeded', nativeFee)

      emitter.emit('check-allowance')
      const currentAllowance = await allowance(walletClient, {
        address: asset,
        owner: account,
        spender: routerAddress,
      })

      if (currentAllowance < amount) {
        emitter.emit('pre-approve')

        const approvalHash = await approve(walletClient, {
          address: asset,
          amount,
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

      const depositHash = await writeContract(walletClient, {
        abi: routerAbi,
        account,
        address: routerAddress,
        args: [
          asset,
          amount,
          sharesOutMin,
          receiver,
          operator,
          true,
          callbackFee,
        ],
        chain: walletClient.chain,
        functionName: 'requestDeposit',
        value: nativeFee,
      }).catch(function (error) {
        emitter.emit('user-signing-deposit-error', error)
      })

      if (!depositHash) {
        return
      }

      emitter.emit('user-signed-deposit', depositHash)

      const depositReceipt = await waitForTransactionReceipt(walletClient, {
        hash: depositHash,
      }).catch(function (error) {
        emitter.emit('deposit-failed', error)
      })

      if (!depositReceipt) {
        return
      }

      const depositEventMap: Record<
        TransactionReceipt['status'],
        keyof RequestDepositEvents
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

export const requestDeposit = (...args: Parameters<typeof runRequestDeposit>) =>
  toPromiseEvent<RequestDepositEvents>(runRequestDeposit(...args))
