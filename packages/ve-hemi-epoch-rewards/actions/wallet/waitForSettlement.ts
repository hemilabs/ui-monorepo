import { type Hash, type TransactionReceipt, type WalletClient } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'

export type Settlement =
  | { outcome: 'settled'; receipt: TransactionReceipt }
  | { outcome: 'cancelled' | 'replaced' }

/**
 * Waits for a transaction, and says what actually happened to it.
 *
 * Speeding up or cancelling from the wallet replaces the transaction at the same nonce,
 * and viem follows the replacement and resolves with ITS receipt whichever it was - it
 * does not reject. A cancellation is a zero-value self-send that succeeds, so a caller
 * reading `receipt.status` alone reports it as a settled claim or a completed withdraw,
 * linking to a transfer of nothing.
 *
 * Only `repriced` is the same transaction - same recipient, value and calldata, new gas
 * price. The other two settle nothing.
 */
export const waitForSettlement = async function (
  walletClient: WalletClient,
  hash: Hash,
): Promise<Settlement> {
  let replacement: 'cancelled' | 'replaced' | undefined

  const receipt = await waitForTransactionReceipt(walletClient, {
    hash,
    onReplaced(replaced) {
      if (replaced.reason !== 'repriced') {
        replacement = replaced.reason === 'cancelled' ? 'cancelled' : 'replaced'
      }
    },
  })

  return replacement
    ? { outcome: replacement }
    : { outcome: 'settled', receipt }
}
