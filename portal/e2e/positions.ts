import { TEST_PRIVATE_KEY } from '@hemilabs/anvil-fork-setup/utils'
import { hemi } from 'hemi-viem'
import { type StakingPositionApiResult } from 'utils/subgraph'
import { getLockEvent } from 've-hemi-actions'
import { createLock } from 've-hemi-actions/actions'
import { createWalletClient, type TransactionReceipt } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { walletTransport } from './anvil'

export const createPosition = async function ({
  amount,
  lockDurationInSeconds,
}: {
  amount: bigint
  lockDurationInSeconds: number
}) {
  const account = privateKeyToAccount(TEST_PRIVATE_KEY)
  const walletClient = createWalletClient({
    account,
    chain: hemi,
    transport: walletTransport,
  })

  const { emitter, promise } = createLock({
    account: account.address,
    amount,
    lockDurationInSeconds,
    walletClient,
  })
  const receipts: TransactionReceipt[] = []
  const failures: string[] = []
  emitter.on('lock-creation-transaction-succeeded', function (receipt) {
    receipts.push(receipt)
  })
  emitter.on('lock-creation-failed-validation', function (reason) {
    failures.push(reason)
  })
  emitter.on('lock-creation-transaction-reverted', function () {
    failures.push('lock reverted')
  })
  emitter.on('approve-transaction-reverted', function () {
    failures.push('approval reverted')
  })
  const onError = (error: Error) => failures.push(error.message)
  emitter.on('approve-failed', onError)
  emitter.on('lock-creation-failed', onError)
  emitter.on('unexpected-error', onError)
  emitter.on('user-signing-approve-error', onError)
  emitter.on('user-signing-lock-creation-error', onError)
  await promise

  const [receipt] = receipts
  const lockEvent = receipt && getLockEvent(receipt)
  if (!lockEvent) {
    throw new Error(
      `Seeding the position failed: ${failures.join(', ') || 'no Lock event'}`,
    )
  }
  const { lockDuration, tokenId, ts } = lockEvent

  return {
    amount: amount.toString(),
    blockNumber: receipt.blockNumber.toString(),
    blockTimestamp: ts.toString(),
    forfeitable: false,
    id: tokenId.toString(),
    lockTime: lockDuration.toString(),
    owner: account.address,
    pastOwners: [],
    status: 'active',
    timestamp: ts.toString(),
    tokenId: tokenId.toString(),
    transactionHash: receipt.transactionHash,
    transferable: true,
  } satisfies StakingPositionApiResult
}
