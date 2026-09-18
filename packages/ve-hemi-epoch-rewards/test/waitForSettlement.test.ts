import { waitForTransactionReceipt } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { waitForSettlement } from '../actions/wallet/waitForSettlement.ts'

vi.mock('viem/actions', () => ({ waitForTransactionReceipt: vi.fn() }))

const hash = `0x${'a'.repeat(64)}` as const
const receipt = { status: 'success', transactionHash: hash }

// viem follows a replaced transaction and resolves with ITS receipt for every reason, so
// the reason is the only thing that distinguishes a fee bump from a cancellation.
const replaceWith = (reason: 'cancelled' | 'replaced' | 'repriced') =>
  vi
    .mocked(waitForTransactionReceipt)
    .mockImplementation(async function (_client, args) {
      args.onReplaced?.({ reason } as never)
      return receipt as never
    })

describe('waitForSettlement', function () {
  beforeEach(function () {
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt as never)
  })

  it('settles an ordinary transaction', async function () {
    expect(await waitForSettlement({} as never, hash)).toEqual({
      outcome: 'settled',
      receipt,
    })
  })

  // A fee bump is the same transaction with a new gas price. Treating it as a failure
  // would send the holder to sign again for work that has already been done.
  it('treats a repriced transaction as the transaction it replaced', async function () {
    replaceWith('repriced')

    expect(await waitForSettlement({} as never, hash)).toEqual({
      outcome: 'settled',
      receipt,
    })
  })

  it.each(['cancelled', 'replaced'] as const)(
    'reports a %s transaction as settling nothing',
    async function (reason) {
      replaceWith(reason)

      expect(await waitForSettlement({} as never, hash)).toEqual({
        outcome: reason,
      })
    },
  )

  // The receipt of a cancellation is a successful zero-value self-send. Reading status
  // alone is exactly what reports it as a paid claim.
  it('does not return the replacement receipt when nothing settled', async function () {
    replaceWith('cancelled')

    const settlement = await waitForSettlement({} as never, hash)

    expect('receipt' in settlement).toBe(false)
  })
})
