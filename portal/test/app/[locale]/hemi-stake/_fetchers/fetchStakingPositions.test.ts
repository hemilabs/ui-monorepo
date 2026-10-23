import { fetchStakingPositions } from 'app/[locale]/hemi-stake/_fetchers/fetchStakingPositions'
import { getLockedPositions } from 'utils/subgraph'
import { getAutoRelockStatus } from 've-hemi-actions/actions'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utils/subgraph')
vi.mock('ve-hemi-actions/actions')

const address = '0xbb1de7bB6049a20ec360f26d468337476Ce2D38F'
const chainId = 43111
const hemiClient = {}

const position = (tokenId, status = 'active') => ({
  amount: BigInt(100),
  lockTime: BigInt(15778800),
  status,
  timestamp: BigInt(1794337048),
  tokenId: BigInt(tokenId),
})

const status = (effectiveLockEnd, isAutoRelockEnabled) => ({
  effectiveLockEnd: BigInt(effectiveLockEnd),
  isAutoRelockEnabled,
})

// snapToEpoch(1794337048 + 15778800), pinned so a drift in the derivation fails here
const derivedEnd = BigInt(1810115848 - (1810115848 % 525960))

const fetch = () => fetchStakingPositions({ address, chainId, hemiClient })

describe('fetchStakingPositions', function () {
  it('pairs each status with the position it belongs to', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([
      position(10),
      position(20),
    ])
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      status(111, false),
      status(222, true),
    ])

    const positions = await fetch()

    expect(positions).toHaveLength(2)
    expect(positions[0]).toMatchObject({
      autoRelock: false,
      effectiveLockEnd: BigInt(111),
      tokenId: BigInt(10),
    })
    expect(positions[1]).toMatchObject({
      autoRelock: true,
      effectiveLockEnd: BigInt(222),
      tokenId: BigInt(20),
    })
  })

  it('reads only the active positions', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([
      position(10),
      position(20, 'withdrawn'),
    ])
    vi.mocked(getAutoRelockStatus).mockResolvedValue([status(111, true)])

    const positions = await fetch()

    expect(getAutoRelockStatus).toHaveBeenCalledExactlyOnceWith(hemiClient, [
      BigInt(10),
    ])
    expect(positions[1]).toMatchObject({
      autoRelock: false,
      effectiveLockEnd: derivedEnd,
      tokenId: BigInt(20),
    })
  })

  it('keeps the pairing when a withdrawn position sits between active ones', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([
      position(10),
      position(20, 'withdrawn'),
      position(30),
    ])
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      status(111, false),
      status(333, true),
    ])

    const positions = await fetch()

    expect(getAutoRelockStatus).toHaveBeenCalledExactlyOnceWith(hemiClient, [
      BigInt(10),
      BigInt(30),
    ])
    expect(positions.map(({ effectiveLockEnd }) => effectiveLockEnd)).toEqual([
      BigInt(111),
      derivedEnd,
      BigInt(333),
    ])
    expect(positions.map(({ autoRelock }) => autoRelock)).toEqual([
      false,
      false,
      true,
    ])
  })

  it('keeps the zero a burned token answers instead of inventing an end', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([position(10)])
    vi.mocked(getAutoRelockStatus).mockResolvedValue([status(0, false)])

    const [onlyPosition] = await fetch()

    expect(onlyPosition.effectiveLockEnd).toBe(BigInt(0))
  })

  it('leaves the chain alone when no position is active', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([
      position(10, 'withdrawn'),
      position(20, 'withdrawn'),
    ])

    const positions = await fetch()

    expect(getAutoRelockStatus).not.toHaveBeenCalled()
    expect(positions.every(({ autoRelock }) => autoRelock === false)).toBe(true)
  })

  it('resolves an empty list for an address with no position', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([])

    await expect(fetch()).resolves.toEqual([])
    expect(getAutoRelockStatus).not.toHaveBeenCalled()
  })

  it('rejects when the status read fails', async function () {
    vi.mocked(getLockedPositions).mockResolvedValue([position(10)])
    vi.mocked(getAutoRelockStatus).mockRejectedValue(new Error('RPC is down'))

    await expect(fetch()).rejects.toThrow('RPC is down')
  })

  it('rejects when the subgraph fails', async function () {
    vi.mocked(getLockedPositions).mockRejectedValue(new Error('502'))

    await expect(fetch()).rejects.toThrow('502')
  })
})
