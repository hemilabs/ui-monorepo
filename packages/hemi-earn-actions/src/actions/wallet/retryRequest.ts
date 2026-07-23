import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'

import { agentAbi } from '../../agentAbi.ts'
import type { RetryRequestEvents } from '../../types.ts'

const runRetryRequest = ({
  account,
  agentAddress,
  nativeFee = BigInt(0),
  requestId,
  walletClient,
}: {
  account: Address
  agentAddress: Address
  nativeFee?: bigint
  requestId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<RetryRequestEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      if (requestId <= BigInt(0)) {
        emitter.emit('tx-failed-validation', 'invalid requestId')
        return
      }

      if (nativeFee > BigInt(0)) {
        const balance = await getBalance(walletClient, { address: account })
        if (balance < nativeFee) {
          emitter.emit('tx-failed-validation', 'insufficient balance for fee')
          return
        }
      }

      emitter.emit('pre-tx')

      const txHash = await writeContract(walletClient, {
        abi: agentAbi,
        account,
        address: agentAddress,
        args: [requestId],
        chain: walletClient.chain,
        functionName: 'retry',
        value: nativeFee,
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
        keyof RetryRequestEvents
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

export const retryRequest = (...args: Parameters<typeof runRetryRequest>) =>
  toPromiseEvent<RetryRequestEvents>(runRetryRequest(...args))
