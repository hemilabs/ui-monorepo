import { zeroHash } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { waitForSettlement } from '../../../actions/wallet/waitForSettlement'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
}))

const walletClient = {}

// viem resolves with the replacement's receipt, after reporting why it was replaced.
const replacedWith = (reason: string, receipt: object) =>
  vi.mocked(waitForTransactionReceipt).mockImplementation(async function (
    _,
    { onReplaced },
  ) {
    onReplaced?.({ reason })
    return receipt
  })

describe('waitForSettlement', function () {
  it('should settle with the receipt when nothing replaced the transaction', async function () {
    const receipt = { status: 'success', transactionHash: zeroHash }
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    await expect(waitForSettlement(walletClient, zeroHash)).resolves.toEqual({
      outcome: 'settled',
      receipt,
    })
  })

  it('should settle with the new receipt when the transaction was repriced', async function () {
    const receipt = { status: 'success', transactionHash: '0x01' }
    replacedWith('repriced', receipt)

    await expect(waitForSettlement(walletClient, zeroHash)).resolves.toEqual({
      outcome: 'settled',
      receipt,
    })
  })

  // A cancel is a zero-value send to self, and it succeeds.
  it('should not settle a cancelled transaction, although its receipt succeeded', async function () {
    replacedWith('cancelled', { status: 'success' })

    await expect(waitForSettlement(walletClient, zeroHash)).resolves.toEqual({
      outcome: 'cancelled',
    })
  })

  it('should not settle a transaction replaced by a different one', async function () {
    replacedWith('replaced', { status: 'success' })

    await expect(waitForSettlement(walletClient, zeroHash)).resolves.toEqual({
      outcome: 'replaced',
    })
  })

  it('should reject when waiting for the receipt fails', async function () {
    const error = new Error('timeout')
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(error)

    await expect(waitForSettlement(walletClient, zeroHash)).rejects.toBe(error)
  })
})
