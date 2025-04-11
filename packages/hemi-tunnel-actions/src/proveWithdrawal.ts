import { EventEmitter } from 'events'
import {
  Address,
  Hash,
  PublicClient,
  WalletClient,
  publicActions,
  isAddress,
  isHash,
  PublicActions,
} from 'viem'
import {
  getWithdrawalStatus,
  PublicActionsL1,
  publicActionsL1,
  PublicActionsL2,
  publicActionsL2,
  walletActionsL1,
} from 'viem/op-stack'

import { ProveEvents } from './types'
import { toPromiseEvent } from './utils'

type ProveWithdrawalParams = {
  account: Address
  l1WalletClient: WalletClient
  l2PublicClient: PublicClient
  withdrawalTransactionHash: Hash
}

const canProveWithdrawal = async function ({
  account,
  l1WalletClient,
  l2PublicClient,
  withdrawalTransactionHash,
}: {
  account: Address
  l1WalletClient: WalletClient
  l2PublicClient: PublicClient
  withdrawalTransactionHash: Hash
}): Promise<{ canProve: boolean; reason?: string }> {
  if (!isHash(withdrawalTransactionHash)) {
    return { canProve: false, reason: 'invalid withdrawal transaction hash' }
  }
  if (!isAddress(account)) {
    return { canProve: false, reason: 'account is not a valid address' }
  }

  const receipt = await l2PublicClient
    .getTransactionReceipt({
      hash: withdrawalTransactionHash,
    })
    .catch(() => null)

  if (!receipt || receipt.status !== 'success') {
    return {
      canProve: false,
      reason: 'Invalid or unsuccessful transaction receipt',
    }
  }

  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  const withdrawalStatus = await getWithdrawalStatus(l1WalletClient, {
    chain: l1WalletClient.chain,
    receipt,
    targetChain: l2PublicClient.chain,
  })

  if (withdrawalStatus !== 'ready-to-prove') {
    return {
      canProve: false,
      reason: `Withdrawal status is not ready-to-prove, current status: ${withdrawalStatus}`,
    }
  }

  return { canProve: true }
}

export const prepareProveWithdrawal = ({
  account,
  hash,
  l1PublicClient,
  l2PublicClient,
}: {
  account: Address
  hash: Hash
  l1PublicClient: PublicActions & PublicActionsL1
  l2PublicClient: PublicClient & PublicActionsL2
}) =>
  l2PublicClient
    .getTransactionReceipt({
      hash,
    })
    .then(withdrawalReceipt =>
      // withdrawals is ready-to-prove, as checked above, so this will
      // return the data we need
      l1PublicClient.waitToProve({
        receipt: withdrawalReceipt,
        // @ts-expect-error chain is a valid chain
        targetChain: l2PublicClient.chain,
      }),
    )
    .then(({ output, withdrawal }) =>
      // @ts-expect-error chain is not required, unsure why TS marks it as required
      l2PublicClient.buildProveWithdrawal({
        account,
        output,
        withdrawal,
      }),
    )

const runProveWithdrawal = ({
  account,
  l1WalletClient,
  l2PublicClient,
  withdrawalTransactionHash,
}: ProveWithdrawalParams) =>
  async function (emitter: EventEmitter<ProveEvents>) {
    try {
      const extendedClientL2 = l2PublicClient.extend(publicActionsL2())
      const extendedWalletClientL1 = l1WalletClient
        // Extending the WalletClient with PublicActions, so we don't need another publicClient connected to the
        // same chain. This is valid.
        // See https://viem.sh/docs/clients/wallet#optional-extend-with-public-actions
        .extend(publicActions)
        .extend(publicActionsL1())
        .extend(walletActionsL1())

      const { canProve, reason } = await canProveWithdrawal({
        account,
        l1WalletClient: extendedWalletClientL1,
        l2PublicClient: extendedClientL2,
        withdrawalTransactionHash,
      })

      if (!canProve) {
        emitter.emit('prove-failed-validation', reason!)
        return
      }

      emitter.emit('pre-prove')

      const proveHash = await prepareProveWithdrawal({
        account,
        hash: withdrawalTransactionHash,
        l1PublicClient: extendedWalletClientL1,
        l2PublicClient: extendedClientL2,
      })
        // @ts-expect-error chain is not required, unsure why TS marks it as required
        .then(proveArgs => extendedWalletClientL1.proveWithdrawal(proveArgs))
        .catch(function (error) {
          emitter.emit('user-signed-prove-error', error)
        })

      if (!proveHash) {
        return
      }

      emitter.emit('user-signed-prove', proveHash)

      const proveReceipt = await extendedWalletClientL1
        .waitForTransactionReceipt({
          hash: proveHash,
        })
        .catch(function (err) {
          emitter.emit('prove-failed', err)
        })

      if (!proveReceipt) {
        return
      }

      emitter.emit(
        proveReceipt.status === 'success'
          ? 'prove-transaction-succeeded'
          : 'prove-transaction-reverted',
        proveReceipt,
      )
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('prove-settled')
    }
  }

export const proveWithdrawal = (args: ProveWithdrawalParams) =>
  toPromiseEvent<ProveEvents>(runProveWithdrawal(args))
