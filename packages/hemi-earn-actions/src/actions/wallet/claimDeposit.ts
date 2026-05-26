import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'
import type { ClaimDepositEvents } from '../../types'

const runClaimDeposit = ({
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
  async function (emitter: EventEmitter<ClaimDepositEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      // Router IDs start at 1 (see `Router.initialize`), so `0n` is never
      // a valid request and the contract would otherwise revert with an
      // opaque `RequestNotFound`. Fail loudly here instead.
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
        functionName: 'claimDeposit',
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
        keyof ClaimDepositEvents
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

export const claimDeposit = (...args: Parameters<typeof runClaimDeposit>) =>
  toPromiseEvent<ClaimDepositEvents>(runClaimDeposit(...args))
