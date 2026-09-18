import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { hemiSepolia } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { captureAndWithdraw } from '../../../actions/wallet/captureAndWithdraw.ts'
import { claimFrom } from '../../../actions/wallet/claimFrom.ts'
import { claimToken } from '../../../actions/wallet/claimToken.ts'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const account = '0x00000000000000000000000000000000000000cd' as const
const token = '0x00000000000000000000000000000000000000ab' as const
const veHemiAddress = '0x00000000000000000000000000000000000000ef' as const
const hash = `0x${'a'.repeat(64)}` as const
const walletClient = { chain: hemiSepolia } as never

// viem follows a replacement and resolves with ITS receipt whatever the reason, so a
// cancellation arrives as a successful receipt for a zero-value self-send.
const replaceWith = (reason: 'cancelled' | 'replaced' | 'repriced') =>
  vi
    .mocked(waitForTransactionReceipt)
    .mockImplementation(async function (_client, args) {
      args.onReplaced?.({ reason } as never)
      return { status: 'success', transactionHash: hash } as never
    })

// Records every event rather than a chosen few: a test that only listens for the events
// it expects cannot tell "the right one fired" from "the flow stopped before any of
// them".
const record = function (emitter: {
  emit: (name: string, ...args: never[]) => boolean
}) {
  const seen: string[] = []
  const emit = emitter.emit.bind(emitter)
  emitter.emit = function (name: string, ...args: never[]) {
    seen.push(name)
    return emit(name, ...args)
  }
  return seen
}

describe('a transaction replaced from the wallet', function () {
  beforeEach(function () {
    vi.mocked(writeContract).mockResolvedValue(hash)
    // `claimFrom` returns the registry cursor (0 = whole registry settled);
    // `capturePositionClass` returns a bool.
    vi.mocked(simulateContract).mockImplementation(
      async (_c, args) =>
        (args.functionName === 'capturePositionClass'
          ? { result: true }
          : { result: BigInt(0) }) as never,
    )
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    } as never)
    // veHemi() matches, positionClass() not captured yet.
    vi.mocked(readContract).mockImplementation(
      async (_c, args) =>
        (args.functionName === 'veHemi'
          ? veHemiAddress
          : [BigInt(0), false, false]) as never,
    )
  })

  describe('claimFrom', function () {
    const run = () =>
      claimFrom({
        account,
        fromEpoch: 1,
        toEpoch: 2,
        tokenId: BigInt(1),
        tokenStart: BigInt(0),
        walletClient,
      })

    it('does not report a cancelled claim as settled', async function () {
      replaceWith('cancelled')
      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('user-signing-claim-from-error')
      expect(seen).not.toContain('claim-from-transaction-succeeded')
    })

    it('does not report a substituted claim as settled', async function () {
      replaceWith('replaced')
      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('claim-from-failed')
      expect(seen).not.toContain('claim-from-transaction-succeeded')
    })

    // A fee bump is the same claim. Treating it as a failure would ask the holder to
    // sign again for epochs that have already settled.
    it('still reports a repriced claim as settled', async function () {
      replaceWith('repriced')
      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('claim-from-transaction-succeeded')
    })
  })

  describe('claimToken', function () {
    it('does not report a cancelled per-asset claim as settled', async function () {
      replaceWith('cancelled')
      const { emitter, promise } = claimToken({
        account,
        fromEpoch: 1,
        toEpoch: 2,
        token,
        tokenId: BigInt(1),
        walletClient,
      })
      const seen = record(emitter)
      await promise

      expect(seen).toContain('user-signing-claim-token-error')
      expect(seen).not.toContain('claim-token-transaction-succeeded')
    })

    // A substitution is a failure rather than the holder's decision, so it reports a
    // different event from the cancellation above.
    it('reports a substituted per-asset claim as a failure', async function () {
      replaceWith('replaced')
      const { emitter, promise } = claimToken({
        account,
        fromEpoch: 1,
        toEpoch: 2,
        token,
        tokenId: BigInt(1),
        walletClient,
      })
      const seen = record(emitter)
      await promise

      expect(seen).toContain('claim-token-failed')
      expect(seen).not.toContain('claim-token-transaction-succeeded')
    })
  })

  describe('captureAndWithdraw', function () {
    const run = () =>
      captureAndWithdraw({
        account,
        tokenId: BigInt(1),
        veHemiAddress,
        walletClient,
      })

    // Nothing was burned. Reporting it as a completed withdraw marks the position
    // withdrawn and drops it out of the table while it still exists on chain.
    it('does not report a cancelled withdraw as a completed one', async function () {
      // The capture settles; only the withdraw is cancelled.
      let call = 0
      vi.mocked(waitForTransactionReceipt).mockImplementation(
        async function (_client, args) {
          call += 1
          if (call > 1) {
            args.onReplaced?.({ reason: 'cancelled' } as never)
          }
          return { status: 'success', transactionHash: hash } as never
        },
      )
      // Uncaptured before the capture, captured after it, so the flow reaches the burn.
      let captured = false
      vi.mocked(readContract).mockImplementation(async function (_c, args) {
        if (args.functionName === 'veHemi') return veHemiAddress as never
        const answer = [BigInt(0), false, captured] as never
        captured = true
        return answer
      })

      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('user-signing-withdraw-error')
      expect(seen).not.toContain('withdraw-transaction-succeeded')
    })

    // The capture step is already showing as pending, so it needs a terminal event of
    // its own or the drawer spins for ever.
    it('gives a cancelled capture a terminal capture event', async function () {
      replaceWith('cancelled')
      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('user-signing-capture-error')
      expect(seen).not.toContain('capture-transaction-succeeded')
    })

    it('gives a substituted capture a terminal capture event', async function () {
      replaceWith('replaced')
      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('user-signing-capture-error')
      expect(seen).not.toContain('capture-transaction-succeeded')
    })

    // A wait that rejects - the 180s timeout, or a node dropping out mid-poll - must
    // still land the capture step somewhere terminal rather than on `unexpected-error`,
    // which no listener in the drawer handles as a capture outcome.
    it('gives a capture whose wait rejects a terminal capture event', async function () {
      vi.mocked(waitForTransactionReceipt).mockRejectedValue(
        new Error('timed out while waiting for the transaction receipt'),
      )
      const { emitter, promise } = run()
      const seen = record(emitter)
      const refusals: string[] = []
      emitter.on('withdraw-failed-validation', reason => refusals.push(reason))
      await promise

      expect(seen).toContain('user-signing-capture-error')
      expect(seen).not.toContain('unexpected-error')
      expect(seen).not.toContain('capture-transaction-succeeded')
      // The refusal names the wait rather than falling through to the call site's
      // catch-all, which reports every throw as a failed capture.
      expect(refusals).toEqual([
        'waiting for the position class capture failed',
      ])
    })

    it('reports a substituted withdraw as a failure rather than a burn', async function () {
      // The capture settles; only the withdraw is substituted.
      let call = 0
      vi.mocked(waitForTransactionReceipt).mockImplementation(
        async function (_client, args) {
          call += 1
          if (call > 1) {
            args.onReplaced?.({ reason: 'replaced' } as never)
          }
          return { status: 'success', transactionHash: hash } as never
        },
      )
      let captured = false
      vi.mocked(readContract).mockImplementation(async function (_c, args) {
        if (args.functionName === 'veHemi') return veHemiAddress as never
        const answer = [BigInt(0), false, captured] as never
        captured = true
        return answer
      })

      const { emitter, promise } = run()
      const seen = record(emitter)
      await promise

      expect(seen).toContain('withdraw-failed')
      expect(seen).not.toContain('withdraw-transaction-succeeded')
    })
  })
})
