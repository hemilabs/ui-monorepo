import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'
import type { CancelRedeemEvents } from '../../types'

// Wraps `Router.cancel(requestId)` on Hemi. Caller must be the request's
// `operator` (see `getRequest(id).operator`); the contract reverts otherwise.
// This call ONLY emits `CancellationRequested(requestId)` — it does not move
// the request out of PENDING. A keeper observes the event off-chain and calls
// `Agent.cancel(id)` on Ethereum to return the shares, which produces the
// `MSG_REQUEST_CANCEL` callback that finally sets the Router status to
// CANCELLED. The user then calls `recoverRedeem(id)` to pull shares back.
const runCancelRedeem = ({
  account,
  requestId,
  routerAddress = getHemiEarnRouterAddress(),
  walletClient,
}: {
  account: Address
  requestId: bigint
  routerAddress?: Address
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<CancelRedeemEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      if (requestId <= BigInt(0)) {
        emitter.emit('tx-failed-validation', 'invalid requestId')
        return
      }

      if (isAddressEqual(account, zeroAddress)) {
        emitter.emit('tx-failed-validation', 'invalid account')
        return
      }

      emitter.emit('pre-tx')

      const txHash = await writeContract(walletClient, {
        abi: routerAbi,
        account,
        address: routerAddress,
        args: [requestId],
        chain: walletClient.chain,
        functionName: 'cancel',
      }).catch(function (error) {
        emitter.emit('user-signing-tx-error', error)
      })

      if (!txHash) {
        return
      }

      emitter.emit('user-signed-tx', txHash)

      const receipt = await waitForTransactionReceipt(walletClient, {
        hash: txHash,
      }).catch(function (error) {
        emitter.emit('tx-failed', error)
      })

      if (!receipt) {
        return
      }

      const eventMap: Record<
        TransactionReceipt['status'],
        keyof CancelRedeemEvents
      > = {
        reverted: 'tx-transaction-reverted',
        success: 'tx-transaction-succeeded',
      }

      emitter.emit(eventMap[receipt.status], receipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('tx-settled')
    }
  }

export const cancelRedeem = (...args: Parameters<typeof runCancelRedeem>) =>
  toPromiseEvent<CancelRedeemEvents>(runCancelRedeem(...args))
