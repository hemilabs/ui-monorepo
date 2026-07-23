import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants.ts'
import { routerAbi } from '../../routerAbi.ts'
import type { ClaimRedeemEvents } from '../../types.ts'

const runClaimRedeem = ({
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
  async function (emitter: EventEmitter<ClaimRedeemEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      if (requestId <= BigInt(0)) {
        emitter.emit('tx-failed-validation', 'invalid requestId')
        return
      }

      emitter.emit('pre-tx')

      const txHash = await writeContract(walletClient, {
        abi: routerAbi,
        account,
        address: routerAddress,
        args: [requestId],
        chain: walletClient.chain,
        functionName: 'claimRedeem',
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
        keyof ClaimRedeemEvents
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

export const claimRedeem = (...args: Parameters<typeof runClaimRedeem>) =>
  toPromiseEvent<ClaimRedeemEvents>(runClaimRedeem(...args))
