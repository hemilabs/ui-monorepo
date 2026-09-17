import {
  getAddresses,
  getChainId,
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { claimEpochRewards } from '../../actions/wallet/claimEpochRewards.ts'

vi.mock('viem/actions', () => ({
  getAddresses: vi.fn(),
  getChainId: vi.fn(),
  readContract: vi.fn(),
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const holder = '0x00000000000000000000000000000000000000cd' as const
const chainId = 743111
const hash =
  '0x00000000000000000000000000000000000000000000000000000000000000c1' as const

const systemState = (overrides = {}) => ({
  currentEpoch: 3402,
  epochLength: BigInt(525960),
  epochStartTime: BigInt(0),
  firstFundableEpoch: 3002,
  maxClaimEpochs: BigInt(64),
  maxTokensPerClaim: BigInt(8),
  paused: false,
  pausedUntil: BigInt(0),
  settledEpoch: 3401,
  streamCount: BigInt(4),
  tokens: ['0x01', '0x02'],
  ...overrides,
})

// readContract serves three different calls; the stub dispatches on which.
const stubReads = function ({
  claimablePerChunk = () => BigInt(1),
  state = systemState(),
} = {}) {
  vi.mocked(readContract).mockImplementation(async function (_client, args) {
    if (args.functionName === 'MAX_CLAIM_PAIRS') {
      return BigInt(96)
    }
    if (args.functionName === 'systemState') {
      return state
    }
    // Two rows, because the registry has two assets. A chunk where only the SECOND
    // asset pays must still be claimed, so a filter that looked at one row would skip
    // real money.
    return [
      { claimable: BigInt(0), token: '0x01' },
      { claimable: claimablePerChunk(Number(args.args[2])), token: '0x02' },
    ]
  })
}

const claimCalls = () =>
  vi
    .mocked(writeContract)
    .mock.calls.filter(([, args]) => args.functionName === 'claim')

const run = (overrides = {}) =>
  claimEpochRewards({
    chainId,
    fromEpoch: 3002,
    holder,
    lensAddress: '0x00000000000000000000000000000000000000ab',
    publicClient: {},
    rewardsAddress: '0x00000000000000000000000000000000000000ef',
    toEpoch: 3101,
    tokenId: BigInt(1),
    walletClient: { chain: { id: chainId } },
    ...overrides,
  })

describe('claimEpochRewards', function () {
  beforeEach(function () {
    stubReads()
    vi.mocked(getChainId).mockResolvedValue(chainId)
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(getAddresses).mockResolvedValue([holder])
    vi.mocked(writeContract).mockResolvedValue(hash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })
  })

  // 96 pairs / 2 tokens = 48 epochs, so one call still settles the whole registry and
  // the `claimFrom` cursor - which a front end cannot read - is never needed.
  it('chunks by a span that keeps the registry on one page', async function () {
    const { promise } = run()
    await promise

    expect(claimCalls().map(([, args]) => args.args.slice(2))).toEqual([
      [3002, 3049],
      [3050, 3097],
      [3098, 3101],
    ])
  })

  it('narrows the span as the registry grows', async function () {
    stubReads({
      state: systemState({ tokens: ['0x01', '0x02', '0x03', '0x04'] }),
    })

    const { promise } = run({ toEpoch: 3025 })
    await promise

    // 96 / 4 = 24 epochs per call.
    expect(claimCalls()[0][1].args.slice(2)).toEqual([3002, 3025])
  })

  it('only ever calls the four-argument claim', async function () {
    const { promise } = run()
    await promise

    expect(
      vi
        .mocked(writeContract)
        .mock.calls.every(
          ([, args]) => args.functionName === 'claim' && args.args.length === 4,
        ),
    ).toBe(true)
  })

  it('skips chunks that would pay nothing', async function () {
    stubReads({
      claimablePerChunk: from => (from === 3050 ? BigInt(5) : BigInt(0)),
    })

    const { promise } = run()
    await promise

    expect(claimCalls()).toHaveLength(1)
    expect(claimCalls()[0][1].args.slice(2)).toEqual([3050, 3097])
  })

  it('signs nothing when there is nothing owed', async function () {
    stubReads({ claimablePerChunk: () => BigInt(0) })

    const { emitter, promise } = run()
    const nothing = vi.fn()
    emitter.on('nothing-to-claim', nothing)
    await promise

    expect(nothing).toHaveBeenCalledOnce()
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('refuses while the contract is paused', async function () {
    stubReads({ state: systemState({ paused: true }) })

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('contract paused')
    expect(writeContract).not.toHaveBeenCalled()
  })

  // Settling a prefix of the registry and reporting success is the silent half-claim
  // this whole design exists to make impossible.
  it('refuses a registry too large for one page', async function () {
    stubReads({
      state: systemState({
        maxTokensPerClaim: BigInt(2),
        tokens: ['0x01', '0x02', '0x03'],
      }),
    })

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(writeContract).not.toHaveBeenCalled()
    expect(failed).toHaveBeenCalledWith(
      'reward registry too large for a single page',
    )
  })

  // Asked of the wallet itself. `walletClient.chain` is whatever chain the client was
  // built for, so a guard against that field reports Hemi no matter where the wallet is.
  it('stops if the wallet switches chain mid-sequence', async function () {
    vi.mocked(getChainId).mockResolvedValueOnce(chainId).mockResolvedValue(1)

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(claimCalls()).toHaveLength(1)
    expect(failed).toHaveBeenCalledWith('wrong chain')
  })

  // `claim` is holder-only: an account switch would revert on-chain with the user
  // already several signatures into the flow.
  it('stops if the account switches mid-sequence', async function () {
    vi.mocked(getAddresses)
      .mockResolvedValueOnce([holder])
      .mockResolvedValue(['0x00000000000000000000000000000000000000ff'])

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(claimCalls()).toHaveLength(1)
    expect(failed).toHaveBeenCalledWith('holder changed')
  })

  it('stops the sequence when a chunk reverts', async function () {
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce({ status: 'success' })
      .mockResolvedValue({ status: 'reverted' })

    const { emitter, promise } = run()
    const reverted = vi.fn()
    emitter.on('claim-epoch-chunk-reverted', reverted)
    await promise

    expect(claimCalls()).toHaveLength(2)
    expect(reverted).toHaveBeenCalledOnce()
  })

  it('reports progress as chunk N of M', async function () {
    const { emitter, promise } = run()
    const progress: unknown[] = []
    emitter.on('claim-epoch-chunk-succeeded', (_receipt, p) => progress.push(p))
    await promise

    expect(progress).toEqual([
      { chunk: 1, chunks: 3, from: 3002, to: 3049 },
      { chunk: 2, chunks: 3, from: 3050, to: 3097 },
      { chunk: 3, chunks: 3, from: 3098, to: 3101 },
    ])
  })

  // The pre-claim window IS the first chunk being prepared. Announcing it as chunk 0
  // put "Claim 0 of 3" on screen for the whole of the first wallet prompt.
  it('numbers the chunk it is preparing from one', async function () {
    const { emitter, promise } = run()
    const announced: unknown[] = []
    emitter.on('pre-claim-epoch-rewards', p => announced.push(p))
    await promise

    expect(announced).toEqual([{ chunk: 1, chunks: 3, from: 3002, to: 3049 }])
  })

  // Without this, a failure in one of the per-chunk guards was reported against the
  // chunk that last SUCCEEDED, marking a paid chunk as the one that failed.
  it('announces each chunk before its guards run', async function () {
    vi.mocked(getChainId).mockResolvedValueOnce(chainId).mockResolvedValue(1)
    const { emitter, promise } = run()
    const announced: unknown[] = []
    emitter.on('pre-claim-epoch-chunk', p => announced.push(p))
    await promise

    // Chunk 1 signed, chunk 2 announced and then stopped by the chain guard.
    expect(announced).toEqual([
      { chunk: 1, chunks: 3, from: 3002, to: 3049 },
      { chunk: 2, chunks: 3, from: 3050, to: 3097 },
    ])
  })

  it('refuses an empty range', async function () {
    const { emitter, promise } = run({ fromEpoch: 3100, toEpoch: 3099 })
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('empty epoch range')
    expect(readContract).not.toHaveBeenCalled()
  })

  // The two arguments that decide WHOSE position is settled, and into whose hands.
  it('claims the right position for the right holder', async function () {
    const { promise } = run({ toEpoch: 3010 })
    await promise

    expect(claimCalls()[0][1].args).toEqual([BigInt(1), holder, 3002, 3010])
    expect(claimCalls()[0][1].account).toBe(holder)
    expect(claimCalls()[0][1].address).toBe(
      '0x00000000000000000000000000000000000000ef',
    )
  })

  // A `claim` that settles only part of the registry succeeds and reverts nothing - the
  // only evidence is the cursor it returns, which a receipt cannot carry but a
  // simulation can. Signing that transaction is the silent half-claim.
  it('refuses to sign when the simulation returns a non-zero registry cursor', async function () {
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(1) })

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed-validation', failed)
    await promise

    expect(writeContract).not.toHaveBeenCalled()
    expect(failed).toHaveBeenCalledWith(
      'reward registry too large for a single page',
    )
  })

  it('simulates the exact call it is about to sign', async function () {
    const { promise } = run({ toEpoch: 3010 })
    await promise

    const [, simulated] = vi.mocked(simulateContract).mock.calls[0]
    const [, written] = vi.mocked(writeContract).mock.calls[0]
    expect(simulated.args).toEqual(written.args)
    expect(simulated.functionName).toBe(written.functionName)
  })

  it('stops before signing when the simulation reverts', async function () {
    vi.mocked(simulateContract).mockRejectedValue(new Error('ContractPaused'))

    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-rewards-failed', failed)
    await promise

    expect(writeContract).not.toHaveBeenCalled()
    expect(failed).toHaveBeenCalledOnce()
  })

  it('claims a single-epoch range', async function () {
    const { promise } = run({ fromEpoch: 3002, toEpoch: 3002 })
    await promise

    expect(claimCalls()).toHaveLength(1)
    expect(claimCalls()[0][1].args.slice(2)).toEqual([3002, 3002])
  })

  it('claims a chunk where only the second asset pays', async function () {
    // stubReads already returns a zero first row; a `.some` that checked only the first
    // entry would skip every chunk here.
    const { promise } = run({ toEpoch: 3010 })
    await promise

    expect(claimCalls()).toHaveLength(1)
  })

  // A holder can speed up or cancel a pending transaction from their wallet. viem
  // follows the replacement and resolves with ITS receipt in every case, so without a
  // reason check a cancellation - a zero-value self-send that succeeds - is
  // indistinguishable from a settled claim.
  describe('a transaction replaced from the wallet', function () {
    const replaceWith = (reason: 'cancelled' | 'replaced' | 'repriced') =>
      vi
        .mocked(waitForTransactionReceipt)
        .mockImplementation(async function (_client, args) {
          args.onReplaced?.({ reason } as never)
          return { status: 'success', transactionHash: hash } as never
        })

    it('reports a cancelled claim as declined, not as paid', async function () {
      replaceWith('cancelled')

      const { emitter, promise } = run({ toEpoch: 3010 })
      const succeeded = vi.fn()
      const declined = vi.fn()
      emitter.on('claim-epoch-chunk-succeeded', succeeded)
      emitter.on('user-signing-claim-epoch-rewards-error', declined)
      await promise

      expect(succeeded).not.toHaveBeenCalled()
      expect(declined).toHaveBeenCalledOnce()
    })

    it('reports a substituted transaction as a failure, not as paid', async function () {
      replaceWith('replaced')

      const { emitter, promise } = run({ toEpoch: 3010 })
      const succeeded = vi.fn()
      const failed = vi.fn()
      emitter.on('claim-epoch-chunk-succeeded', succeeded)
      emitter.on('claim-epoch-rewards-failed', failed)
      await promise

      expect(succeeded).not.toHaveBeenCalled()
      expect(failed).toHaveBeenCalledOnce()
    })

    // A fee bump is the same claim with a new gas price. Treating it as a failure would
    // send the holder to sign a second transaction for epochs that had just settled.
    it('accepts a repriced claim as the claim it replaced', async function () {
      replaceWith('repriced')

      const { emitter, promise } = run({ toEpoch: 3010 })
      const succeeded = vi.fn()
      emitter.on('claim-epoch-chunk-succeeded', succeeded)
      await promise

      expect(succeeded).toHaveBeenCalledOnce()
    })

    // Stopping matters as much as the label: the walk carries on to the next position
    // after a settled chunk, and there is no reason to keep prompting someone who has
    // just cancelled.
    it('stops the sequence rather than signing the next chunk', async function () {
      replaceWith('cancelled')

      const { promise } = run()
      await promise

      expect(claimCalls()).toHaveLength(1)
    })
  })

  it('always settles, whatever the outcome', async function () {
    vi.mocked(simulateContract).mockRejectedValue(new Error('boom'))

    const { emitter, promise } = run()
    const settled = vi.fn()
    emitter.on('claim-epoch-rewards-settled', settled)
    await promise

    expect(settled).toHaveBeenCalledOnce()
  })
})
