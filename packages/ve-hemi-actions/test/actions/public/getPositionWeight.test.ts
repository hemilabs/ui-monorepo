import { zeroAddress } from 'viem'
import { multicall } from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getPositionWeight } from '../../../actions'
import * as constants from '../../../constants'

vi.mock('viem/actions')

describe('getPositionWeight', function () {
  const client = { chain: { id: 1 } }
  const tokenId = 30917n

  const slope = 396101097675n
  const bucketStart = 1792471680n
  const lockEnd = bucketStart + 60n * 525960n
  const relocked = 12395833333322008500n

  const decayingAt = at => (at < lockEnd ? slope * (lockEnd - at) : 0n)
  const readsAt = (now, end = lockEnd) =>
    [now, now + 1n].map(at => (at < end ? slope * (end - at) : 0n))

  beforeEach(function () {
    vi.spyOn(constants, 'getVeHemiContractAddress').mockReturnValue(zeroAddress)
  })

  it('should read the same position one second apart', async function () {
    vi.mocked(multicall).mockResolvedValue(readsAt(1792786000n))

    await getPositionWeight(client, tokenId, 1792786000n)

    const readAt = timestamp => ({
      abi: veHemiAbi,
      address: zeroAddress,
      args: [tokenId, timestamp],
      functionName: 'balanceOfNFTAt',
    })
    expect(multicall).toHaveBeenCalledExactlyOnceWith(client, {
      allowFailure: false,
      contracts: [readAt(1792786000n), readAt(1792786001n)],
    })
  })

  it('should report the current weight as the contract does', async function () {
    vi.mocked(multicall).mockResolvedValue(readsAt(1792786000n))

    await expect(
      getPositionWeight(client, tokenId, 1792786000n),
    ).resolves.toMatchObject({ current: decayingAt(1792786000n) })
  })

  it.each([
    ['at the start of the epoch', bucketStart],
    ['mid epoch', 1792786000n],
    ['at the last second of the epoch', bucketStart + 525959n],
  ])('should hold the relocked weight %s', async function (_, now) {
    vi.mocked(multicall).mockResolvedValue(readsAt(now))

    await expect(
      getPositionWeight(client, tokenId, now),
    ).resolves.toMatchObject({ relocked })
  })

  it('should hold the weight a decaying position reports at the epoch mean', async function () {
    vi.mocked(multicall).mockResolvedValue(readsAt(bucketStart))

    const { current, relocked: held } = await getPositionWeight(
      client,
      tokenId,
      bucketStart,
    )

    expect(current - held).toBe(slope * 262980n)
  })

  it('should keep the weight of an already relocked position untouched', async function () {
    vi.mocked(multicall).mockResolvedValue([
      37812499999997275080n,
      37812499999997275080n,
    ])

    await expect(
      getPositionWeight(client, tokenId, 1792786000n),
    ).resolves.toEqual({
      current: 37812499999997275080n,
      relocked: 37812499999997275080n,
    })
  })

  it('should stay exact for a lock ending within the epoch', async function () {
    const endsSoon = bucketStart + 400_000n
    const now = bucketStart + 200_000n
    vi.mocked(multicall).mockResolvedValue(readsAt(now, endsSoon))

    await expect(
      getPositionWeight(client, tokenId, now),
    ).resolves.toMatchObject({
      relocked: slope * (endsSoon - bucketStart - 262980n),
    })
  })

  it('should be worth nothing once the lock is over', async function () {
    vi.mocked(multicall).mockResolvedValue([0n, 0n])

    await expect(
      getPositionWeight(client, tokenId, lockEnd + 1n),
    ).resolves.toEqual({ current: 0n, relocked: 0n })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(getPositionWeight({}, tokenId, 1792786000n)).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
