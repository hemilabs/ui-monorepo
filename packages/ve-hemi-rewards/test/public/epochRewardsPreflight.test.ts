import { BaseError, ContractFunctionRevertedError } from 'viem'
import { readContract, simulateContract } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSettleableTokens } from '../../actions/public/epochRewardsPreflight.ts'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
  simulateContract: vi.fn(),
}))

const holder = '0x00000000000000000000000000000000000000cd' as const
const stuck = '0x00000000000000000000000000000000000000A1' as const
const paying = '0x00000000000000000000000000000000000000B2' as const

// What viem raises when the CONTRACT refuses, as opposed to when the node does. `raw`
// is the discriminator: viem synthesises this same error type for a bare JSON-RPC
// -32603 too, but only fills `raw` when revert data actually came back.
const revertWith = (raw: `0x${string}` | undefined) =>
  new BaseError('reverted', {
    cause: new ContractFunctionRevertedError({
      abi: [],
      data: raw,
      functionName: 'claimToken',
    }),
  })

// RangeTooWide, as the deployed contract actually returns it.
const contractRevert = () => revertWith('0x417ce9df')

// What viem synthesises for a bare JSON-RPC -32603: same error type, no revert data.
const nodeErrorRevert = () => revertWith(undefined)

const claimableRows = (
  perToken: Record<string, (from: number) => bigint>,
  from: number,
) =>
  [stuck, paying].map(token => ({
    claimable: perToken[token]?.(from) ?? BigInt(0),
    token,
  }))

const stubClaimable = function (
  perToken: Record<string, (from: number) => bigint>,
) {
  vi.mocked(readContract).mockImplementation(async (_client, args) =>
    claimableRows(perToken, Number((args as { args: unknown[] }).args[2])),
  )
}

const run = (overrides = {}) =>
  getSettleableTokens({} as never, {
    fromEpoch: 3002,
    holder,
    lensAddress: '0x00000000000000000000000000000000000000ab',
    maxClaimEpochs: 64,
    paused: false,
    rewardsAddress: '0x00000000000000000000000000000000000000ef',
    toEpoch: 3401,
    tokenId: BigInt(1),
    tokens: [stuck, paying],
    ...overrides,
  })

describe('getSettleableTokens', function () {
  beforeEach(function () {
    stubClaimable({ [paying]: () => BigInt(5), [stuck]: () => BigInt(7) })
    vi.mocked(simulateContract).mockResolvedValue({} as never)
  })

  // The defect this function shipped with: it asked about the WHOLE range, which a
  // deployment older than MAX_CLAIM_EPOCHS always rejects, so every asset came back
  // blocked for a reason that had nothing to do with any asset.
  it('never simulates a window wider than the claim bound', async function () {
    await run()

    vi.mocked(simulateContract).mock.calls.forEach(function ([, args]) {
      const [, , , from, to] = args.args as [
        unknown,
        unknown,
        unknown,
        number,
        number,
      ]
      expect(to - from + 1).toBeLessThanOrEqual(64)
    })
  })

  it('simulates the first window in which the asset actually pays', async function () {
    // The stuck asset only starts paying in the third window.
    stubClaimable({
      [paying]: () => BigInt(5),
      [stuck]: from => (from >= 3130 ? BigInt(9) : BigInt(0)),
    })

    await run()

    const windows = Object.fromEntries(
      vi
        .mocked(simulateContract)
        .mock.calls.map(
          ([, args]) => args.args as [unknown, unknown, string, number, number],
        )
        .map(([, , token, from]) => [token, from]),
    )
    expect(windows[paying]).toBe(3002)
    expect(windows[stuck]).toBe(3130)
  })

  // A window the asset owes nothing for performs no transfer, so it would simulate
  // cleanly and report a blocklisted asset as settleable - the one answer this
  // function exists to get right.
  it('does not call an asset settleable on the strength of a window it owes nothing in', async function () {
    stubClaimable({ [paying]: () => BigInt(5), [stuck]: () => BigInt(0) })

    const result = await run()

    expect(result).toContainEqual({ state: 'nothing-owed', token: stuck })
    vi.mocked(simulateContract).mock.calls.forEach(([, args]) =>
      expect((args.args as unknown[])[2]).not.toBe(stuck),
    )
  })

  it('reports an asset the contract refuses as blocked', async function () {
    vi.mocked(simulateContract).mockImplementation(async (_client, args) =>
      (args as { args: unknown[] }).args[2] === stuck
        ? Promise.reject(contractRevert())
        : ({} as never),
    )

    const result = await run()

    expect(result.find(r => r.token === stuck)!.state).toBe('reverts')
    expect(result.find(r => r.token === paying)!.state).toBe('settles')
  })

  // Saying "cannot be claimed" here would invent a blocklist out of a bad connection,
  // on the screen that exists to get the holder to their money.
  // A node that answers -32603 makes viem raise a ContractFunctionRevertedError with no
  // revert data. Believing it would invent a blocklist out of a flaky connection.
  it('does not blame the asset for a revert that carried no data', async function () {
    vi.mocked(simulateContract).mockRejectedValue(nodeErrorRevert())

    const result = await run()

    expect(result.map(r => r.state)).toEqual(['unknown', 'unknown'])
  })

  it('does not blame the asset when the node failed', async function () {
    vi.mocked(simulateContract).mockRejectedValue(new Error('HTTP 429'))

    const result = await run()

    expect(result.map(r => r.state)).toEqual(['unknown', 'unknown'])
  })

  it('tells a node failure apart from a contract refusal', async function () {
    vi.mocked(simulateContract).mockImplementation(async (_client, args) =>
      (args as { args: unknown[] }).args[2] === stuck
        ? Promise.reject(contractRevert())
        : Promise.reject(new Error('socket hang up')),
    )

    const result = await run()

    expect(result.find(r => r.token === stuck)!.state).toBe('reverts')
    expect(result.find(r => r.token === paying)!.state).toBe('unknown')
  })

  it('asks as the holder, because the contract requires msg.sender to be them', async function () {
    await run()

    const calls = vi.mocked(simulateContract).mock.calls
    expect(calls.map(([, args]) => args.functionName)).toEqual([
      'claimToken',
      'claimToken',
    ])
    // The contract requires msg.sender to BE the holder argument, which is why this
    // cannot be multicall-batched.
    expect(calls.map(([, args]) => args.account)).toEqual([holder, holder])
  })

  it('stops reading windows once every asset has been placed', async function () {
    await run()

    // Both assets pay in the very first window, so one Lens read settles it.
    expect(vi.mocked(readContract)).toHaveBeenCalledTimes(1)
  })

  // A failed window read must not destroy the whole answer, and must never be reported
  // as "nothing owed" - that both disables the holder's button and asserts something
  // about money on the strength of a read that never came back.
  it('reports unknown, not nothing-owed, when a window read fails', async function () {
    vi.mocked(readContract).mockRejectedValue(new Error('HTTP 429'))

    const result = await run()

    expect(result.map(r => r.state)).toEqual(['unknown', 'unknown'])
  })

  it('keeps the assets it already placed when a later window read fails', async function () {
    let call = 0
    vi.mocked(readContract).mockImplementation(async function (_client, args) {
      call += 1
      if (call > 1) {
        throw new Error('HTTP 429')
      }
      return claimableRows(
        { [paying]: () => BigInt(5) },
        Number((args as { args: unknown[] }).args[2]),
      )
    })

    const result = await run()

    expect(result.find(r => r.token === paying)!.state).toBe('settles')
    expect(result.find(r => r.token === stuck)!.state).toBe('unknown')
  })

  // Lens cost is (epochs x registered tokens). A full maxClaimEpochs window against a
  // large registry is past a node's gas cap, which would make the hatch silently dead.
  it('narrows the window as the registry grows', async function () {
    const many = Array.from(
      { length: 8 },
      (_unused, i) => `0x0000000000000000000000000000000000000c${i}0` as const,
    )
    stubClaimable({})
    await run({ tokens: many })

    const [, args] = vi.mocked(readContract).mock.calls[0]
    const [, , from, to] = (args as { args: number[] }).args
    expect(to - from + 1).toBeLessThanOrEqual(192 / 8)
  })

  it('returns nothing for an empty registry rather than failing', async function () {
    expect(await run({ tokens: [] })).toEqual([])
    expect(simulateContract).not.toHaveBeenCalled()
  })

  // A pause reverts every simulation with `ContractPaused`, which carries data and so is
  // indistinguishable from a token refusing the transfer. Calling a global, temporary
  // pause a per-asset blocklist sends the holder after a problem that does not exist.
  describe('while the contract is paused', function () {
    it('reports every asset as unknown rather than blocked', async function () {
      const settlements = await run({ paused: true })

      expect(settlements).toEqual([
        { state: 'unknown', token: stuck },
        { state: 'unknown', token: paying },
      ])
    })

    it('does not simulate at all', async function () {
      await run({ paused: true })

      expect(simulateContract).not.toHaveBeenCalled()
    })
  })
})
