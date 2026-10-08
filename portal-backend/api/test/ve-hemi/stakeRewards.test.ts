import { getEpochFunding, getSystemState } from 've-hemi-epoch-rewards/actions'
// eslint-disable-next-line node/no-missing-import
import { symbol } from 'viem-erc20/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createHemiStakeRewards } from '../../src/ve-hemi/stakeRewards.ts'

vi.mock('ve-hemi-epoch-rewards/actions')
vi.mock('viem-erc20/actions')

const getPriceHistory = vi.fn()
const { getHemiStakeRewards } = createHemiStakeRewards({
  // @ts-expect-error fake cache
  cache: { getPriceHistory },
})

const epochLength = 525_960
const token = '0x99e3dE3817F6081B2568208337ef83295b7f591D'

const mockSystemState = (overrides = {}) =>
  // @ts-expect-error partial system state
  vi.mocked(getSystemState).mockResolvedValueOnce({
    currentEpoch: 3410,
    epochLength: BigInt(epochLength),
    settledEpoch: 3409,
    tokens: [token],
    ...overrides,
  })

const mockFunding = (funded: number[]) =>
  vi
    .mocked(getEpochFunding)
    .mockImplementationOnce(async (_, { fromEpoch, toEpoch }) => [
      {
        claimed: funded.map(f => BigInt(f / 2)),
        epochs: Array.from(
          { length: toEpoch - fromEpoch + 1 },
          (__, i) => fromEpoch + i,
        ),
        funded: funded.map(BigInt),
        swept: funded.map(() => false),
        token,
      },
    ])

const toRow = (epoch: number, funded: number, settled: boolean) => ({
  epoch,
  rewards: [
    {
      claimed: String(funded / 2),
      funded: String(funded),
      priceUsd: null,
      swept: false,
      token: { address: token, chainId: 43111 },
    },
  ],
  settled,
  timestamp: (epoch + 1) * epochLength,
})

describe('getHemiStakeRewards', function () {
  beforeEach(function () {
    vi.mocked(symbol).mockResolvedValue('HEMI')
    getPriceHistory.mockResolvedValue(null)
  })

  it('returns the latest epochs that fit the period, leaving a slot to projected epochs', async function () {
    mockSystemState()
    mockFunding([2, 4, 6, 10, 4])

    const result = await getHemiStakeRewards('1m')

    expect(getEpochFunding).toHaveBeenCalledWith(expect.anything(), {
      fromEpoch: 3406,
      toEpoch: 3410,
      tokens: [token],
    })
    expect(result).toEqual([
      toRow(3407, 4, true),
      toRow(3408, 6, true),
      toRow(3409, 10, true),
      toRow(3410, 4, false),
    ])
  })

  it('leaves out the current epoch when it has no funding', async function () {
    mockSystemState()
    mockFunding([2, 4, 6, 10, 0])

    const result = await getHemiStakeRewards('1m')

    expect(result).toEqual([
      toRow(3406, 2, true),
      toRow(3407, 4, true),
      toRow(3408, 6, true),
      toRow(3409, 10, true),
    ])
  })

  describe('pre-hemiStake rewards', function () {
    it('fills the free slots with both rounds, before the first funded epoch', async function () {
      mockSystemState({ currentEpoch: 3404, settledEpoch: 3403 })
      mockFunding([2, 4, 6])

      const result = await getHemiStakeRewards('3m')

      expect(getEpochFunding).toHaveBeenCalledWith(expect.anything(), {
        fromEpoch: 3402,
        toEpoch: 3404,
        tokens: [token],
      })
      expect(result.map(({ epoch }) => epoch)).toEqual([
        3400, 3401, 3402, 3403, 3404,
      ])
    })

    it('adds only the latest round when one slot is free', async function () {
      mockSystemState({ currentEpoch: 3404, settledEpoch: 3403 })
      mockFunding([2, 4, 6])

      const result = await getHemiStakeRewards('1m')

      expect(result.map(({ epoch }) => epoch)).toEqual([3401, 3402, 3403, 3404])
    })

    it('adds no round when the period starts after the first funded epoch', async function () {
      mockSystemState({ settledEpoch: 3407 })
      mockFunding([2, 4, 6, 0, 0])

      const result = await getHemiStakeRewards('1m')

      expect(result.map(({ epoch }) => epoch)).toEqual([3406, 3407, 3408])
    })
  })

  it('prices each epoch at the latest daily price up to its end date', async function () {
    mockSystemState()
    mockFunding([2, 4, 6, 10, 4])
    getPriceHistory.mockResolvedValue({
      '2026-10-21': '0.5',
      '2026-10-26': '0.6',
      '2026-11-02': '0.7',
    })

    const result = await getHemiStakeRewards('1m')

    expect(getPriceHistory).toHaveBeenCalledWith('HEMI')
    expect(result.map(({ rewards }) => rewards[0].priceUsd)).toEqual([
      null,
      '0.6',
      '0.6',
      '0.7',
    ])
  })

  it('prices a BTC token with the BTC price history', async function () {
    const btcToken = '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28'
    mockSystemState({ tokens: [btcToken] })
    mockFunding([2, 4, 6, 10, 0])
    vi.mocked(symbol).mockResolvedValue('hemiBTC')

    await getHemiStakeRewards('1m')

    expect(getPriceHistory).toHaveBeenCalledWith('BTC')
  })

  it('returns a null price when the price history cannot be read', async function () {
    mockSystemState()
    mockFunding([2, 4, 6, 10, 4])
    getPriceHistory.mockRejectedValue(new Error('redis is down'))

    const result = await getHemiStakeRewards('1m')

    expect(result.map(({ rewards }) => rewards[0].priceUsd)).toEqual([
      null,
      null,
      null,
      null,
    ])
  })
})
