import { type Hash, type TransactionReceipt, type WalletClient } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'

type Settlement =
  | { outcome: 'cancelled' }
  | { outcome: 'replaced' }
  | { outcome: 'settled'; receipt: TransactionReceipt }

export const waitForSettlement = async function (
  walletClient: WalletClient,
  hash: Hash,
): Promise<Settlement> {
  let replacement: 'cancelled' | 'replaced' | undefined

  const receipt = await waitForTransactionReceipt(walletClient, {
    hash,
    onReplaced({ reason }) {
      if (reason !== 'repriced') {
        replacement = reason
      }
    },
  })

  return replacement
    ? { outcome: replacement }
    : { outcome: 'settled', receipt }
}
