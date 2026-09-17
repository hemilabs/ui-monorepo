import {
  getAddresses,
  getChainId,
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { claimEpochRewardsToken } from '../../actions/wallet/claimEpochRewardsToken.ts'

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
// Checksum-shaped, because the registry is checksummed and the action must not care.
const stuckToken = '0x00000000000000000000000000000000000000A1' as const
const payingToken = '0x00000000000000000000000000000000000000B2' as const

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
  tokens: [stuckToken, payingToken],
  ...overrides,
})

const stubReads = function ({
  claimablePerChunk = () => BigInt(1),
  state = systemState(),
} = {}) {
  vi.mocked(readContract).mockImplementation(async function (_client, args) {
    if (args.functionName === 'systemState') {
      return state
    }
    // `preview` is single-token: it answers for the asset named in the call, so a chunk
    // pays only when THAT asset is owed something in it. Only the second asset pays -
    // a scan that ignored `token` would claim chunks for an asset that owes nothing,
    // costing the holder a wallet prompt and gas per chunk.
    // Compared case-insensitively, as an address is on-chain: the action forwards the
    // token exactly as it was given, and a checksummed and a lower-cased address are
    // the same twenty bytes to the contract.
    return String(args.args[2]).toLowerCase() === payingToken.toLowerCase()
      ? claimablePerChunk(Number(args.args[3]))
      : BigInt(0)
  })
}

const claimCalls = () =>
  vi
    .mocked(writeContract)
    .mock.calls.filter(([, args]) => args.functionName === 'claimToken')

const run = (overrides = {}) =>
  claimEpochRewardsToken({
    chainId,
    fromEpoch: 3002,
    holder,
    lensAddress: '0x00000000000000000000000000000000000000ab',
    publicClient: {},
    rewardsAddress: '0x00000000000000000000000000000000000000ef',
    toEpoch: 3101,
    token: payingToken,
    tokenId: BigInt(1),
    walletClient: { chain: { id: chainId } },
    ...overrides,
  } as never)

describe('claimEpochRewardsToken', function () {
  beforeEach(function () {
    stubReads()
    vi.mocked(getChainId).mockResolvedValue(chainId)
    vi.mocked(getAddresses).mockResolvedValue([holder])
    vi.mocked(simulateContract).mockResolvedValue({
      result: undefined,
    } as never)
    vi.mocked(writeContract).mockResolvedValue(hash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
      transactionHash: hash,
    } as never)
  })

  // The whole point of the escape hatch: one asset, so the epoch x token product that
  // binds `claim` reduces to the epoch bound, and there is no registry page to overflow.
  it('spans the full epoch bound, because one asset cannot overflow a page', async function () {
    const { promise } = run()
    await promise

    expect(claimCalls()).toHaveLength(2)
    expect(claimCalls()[0][1].args).toEqual([
      BigInt(1),
      holder,
      payingToken,
      3002,
      3065,
    ])
    expect(claimCalls()[1][1].args).toEqual([
      BigInt(1),
      holder,
      payingToken,
      3066,
      3101,
    ])
  })

  it('only ever claims the named asset', async function () {
    const { promise } = run()
    await promise

    claimCalls().forEach(([, args]) => expect(args.args[2]).toBe(payingToken))
  })

  it('never calls the whole-registry claim', async function () {
    const { promise } = run()
    await promise

    vi.mocked(writeContract).mock.calls.forEach(([, args]) =>
      expect(args.functionName).toBe('claimToken'),
    )
  })

  it('refuses an asset the registry does not list', async function () {
    const { emitter, promise } = run({
      token: '0x00000000000000000000000000000000000000ff',
    })
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('asset is not in the reward registry')
    expect(claimCalls()).toHaveLength(0)
  })

  it('accepts a registered asset whatever its casing', async function () {
    const { promise } = run({ token: payingToken.toLowerCase() })
    await promise

    expect(claimCalls().length).toBeGreaterThan(0)
  })

  it('refuses while the contract is paused', async function () {
    stubReads({ state: systemState({ paused: true }) })
    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('contract paused')
    expect(claimCalls()).toHaveLength(0)
  })

  it('refuses an empty range', async function () {
    const { emitter, promise } = run({ fromEpoch: 3100, toEpoch: 3099 })
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('empty epoch range')
    expect(claimCalls()).toHaveLength(0)
  })

  it('signs nothing when this asset owes nothing', async function () {
    stubReads({ claimablePerChunk: () => BigInt(0) })
    const { emitter, promise } = run()
    const nothing = vi.fn()
    emitter.on('nothing-to-claim', nothing)
    await promise

    expect(nothing).toHaveBeenCalled()
    expect(claimCalls()).toHaveLength(0)
  })

  it('skips chunks that would pay nothing', async function () {
    stubReads({
      claimablePerChunk: from => (from === 3002 ? BigInt(0) : BigInt(5)),
    })
    const { promise } = run()
    await promise

    expect(claimCalls()).toHaveLength(1)
    expect(claimCalls()[0][1].args[3]).toBe(3066)
  })

  // The asset is blocklisted for this holder: the revert comes from the token's own
  // transfer, so it is caught before a signature rather than after gas is spent.
  it('stops before signing when the simulation reverts', async function () {
    vi.mocked(simulateContract).mockRejectedValue(new Error('transfer blocked'))
    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed', failed)
    await promise

    expect(failed).toHaveBeenCalled()
    expect(claimCalls()).toHaveLength(0)
  })

  it('simulates the exact call it is about to sign', async function () {
    const { promise } = run()
    await promise

    const simulated = vi.mocked(simulateContract).mock.calls[0][1]
    expect(simulated.functionName).toBe('claimToken')
    expect(simulated.args).toEqual(claimCalls()[0][1].args)
    expect(simulated.account).toBe(holder)
  })

  it('stops if the wallet switches chain mid-sequence', async function () {
    vi.mocked(getChainId).mockResolvedValueOnce(chainId).mockResolvedValue(1)
    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('wrong chain')
    expect(claimCalls()).toHaveLength(1)
  })

  it('stops if the account switches mid-sequence', async function () {
    vi.mocked(getAddresses)
      .mockResolvedValueOnce([holder])
      .mockResolvedValue(['0x00000000000000000000000000000000000000de'])
    const { emitter, promise } = run()
    const failed = vi.fn()
    emitter.on('claim-epoch-token-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledWith('wallet account changed')
    expect(claimCalls()).toHaveLength(1)
  })

  it('stops the sequence when a chunk reverts', async function () {
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
      transactionHash: hash,
    } as never)
    const { emitter, promise } = run()
    const reverted = vi.fn()
    emitter.on('claim-epoch-token-chunk-reverted', reverted)
    await promise

    expect(reverted).toHaveBeenCalled()
    expect(claimCalls()).toHaveLength(1)
  })

  it('numbers the chunk it is preparing from one', async function () {
    const { emitter, promise } = run()
    const announced: unknown[] = []
    emitter.on('pre-claim-epoch-token', p => announced.push(p))
    await promise

    expect(announced).toEqual([{ chunk: 1, chunks: 2, from: 3002, to: 3065 }])
  })

  it('reports progress as chunk N of M', async function () {
    const { emitter, promise } = run()
    const progress: unknown[] = []
    emitter.on('claim-epoch-token-chunk-succeeded', (_r, p) => progress.push(p))
    await promise

    expect(progress).toEqual([
      { chunk: 1, chunks: 2, from: 3002, to: 3065 },
      { chunk: 2, chunks: 2, from: 3066, to: 3101 },
    ])
  })

  it('always settles, whatever the outcome', async function () {
    vi.mocked(readContract).mockRejectedValue(new Error('rpc down'))
    const { emitter, promise } = run()
    const settled = vi.fn()
    emitter.on('claim-epoch-token-settled', settled)
    await promise

    expect(settled).toHaveBeenCalled()
  })
})
