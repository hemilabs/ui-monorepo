import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  Address,
  Hash,
  isAddress,
  isHash,
  PublicClient,
  WalletClient,
  publicActions,
} from 'viem'
import {
  getWithdrawalStatus,
  getWithdrawals,
  publicActionsL1,
  walletActionsL1,
} from 'viem/op-stack'

import { FinalizeEvents } from './types'

type FinalizeWithdrawalParams = {
  account: Address
  l1WalletClient: WalletClient
  l2PublicClient: PublicClient
  withdrawalTransactionHash: Hash
}

const canFinalizeWithdrawal = async function ({
  account,
  l1WalletClient,
  l2PublicClient,
  withdrawalTransactionHash,
}: FinalizeWithdrawalParams): Promise<{
  canFinalize: boolean
  reason?: string
}> {
  if (!isHash(withdrawalTransactionHash)) {
    return { canFinalize: false, reason: 'invalid withdrawal transaction hash' }
  }
  if (!isAddress(account)) {
    return { canFinalize: false, reason: 'account is not a valid address' }
  }

  const receipt = await l2PublicClient
    .getTransactionReceipt({
      hash: withdrawalTransactionHash,
    })
    .catch(() => null)

  if (!receipt || receipt.status !== 'success') {
    return {
      canFinalize: false,
      reason: 'Invalid or unsuccessful transaction receipt',
    }
  }

  const withdrawalStatus = await getWithdrawalStatus(l1WalletClient, {
    chain: l1WalletClient.chain,
    receipt,
    // @ts-expect-error This works, it fails due to viem bad inference
    targetChain: l2PublicClient.chain,
  }).catch(() => null)

  if (withdrawalStatus !== 'ready-to-finalize') {
    return {
      canFinalize: false,
      reason: withdrawalStatus
        ? `Withdrawal status is not ready-to-finalize, current status: ${withdrawalStatus}`
        : 'Failed to get Withdrawal status',
    }
  }

  return { canFinalize: true }
}

const runFinalizeWithdrawal = ({
  account,
  l1WalletClient,
  l2PublicClient,
  withdrawalTransactionHash,
}: FinalizeWithdrawalParams) =>
  async function (emitter: EventEmitter<FinalizeEvents>) {
    try {
      const extendedL1WalletClient = l1WalletClient
        // Extending the WalletClient with PublicActions, so we don't need another publicClient connected to the
        // same chain. This is valid.
        // See https://viem.sh/docs/clients/wallet#optional-extend-with-public-actions
        .extend(publicActions)
        .extend(publicActionsL1())
        .extend(walletActionsL1())

      const { canFinalize, reason } = await canFinalizeWithdrawal({
        account,
        l1WalletClient: extendedL1WalletClient,
        l2PublicClient,
        withdrawalTransactionHash,
      })

      if (!canFinalize) {
        emitter.emit('finalize-failed-validation', reason!)
        return
      }

      const receipt = await l2PublicClient.getTransactionReceipt({
        hash: withdrawalTransactionHash,
      })

      const [withdrawal] = getWithdrawals(receipt)

      emitter.emit('pre-finalize')

      const finalizeHash = await extendedL1WalletClient
        .finalizeWithdrawal({
          account,
          // @ts-expect-error This works, it fails due to viem bad inference
          targetChain: l2PublicClient.chain,
          withdrawal,
        })
        .catch(function (error) {
          emitter.emit('user-signed-finalize-error', error)
        })

      if (!finalizeHash) {
        return
      }

      emitter.emit('user-signed-finalize', finalizeHash)

      const finalizeReceipt = await extendedL1WalletClient
        .waitForTransactionReceipt({
          hash: finalizeHash,
        })
        .catch(function (err) {
          emitter.emit('finalize-failed', err)
        })

      if (!finalizeReceipt) {
        return
      }

      emitter.emit(
        finalizeReceipt.status === 'success'
          ? 'finalize-transaction-succeeded'
          : 'finalize-transaction-reverted',
        finalizeReceipt,
      )
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('finalize-settled')
    }
  }

export const finalizeWithdrawal = (args: FinalizeWithdrawalParams) =>
  toPromiseEvent<FinalizeEvents>(runFinalizeWithdrawal(args))
