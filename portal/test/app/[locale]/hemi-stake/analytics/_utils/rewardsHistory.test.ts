import { toRewardsSeries } from 'app/[locale]/hemi-stake/analytics/_utils/rewardsHistory'
import { describe, expect, it } from 'vitest'

const hemi = {
  address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  chainId: 43111,
} as const
const hemiBtc = {
  address: '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
  chainId: 43111,
} as const
const unknown = {
  address: '0x0000000000000000000000000000000000000001',
  chainId: 43111,
} as const

const tokens = [
  { ...hemi, decimals: 18, symbol: 'HEMI' },
  { ...hemiBtc, decimals: 8, symbol: 'hemiBTC' },
  { ...unknown, decimals: 18, symbol: 'NEW' },
]

const getToken = ({ address }) =>
  Promise.resolve(tokens.find(token => token.address === address))

describe('toRewardsSeries', function () {
  it('returns one USD series per reward token', async function () {
    const series = await toRewardsSeries({
      epochs: [
        {
          epoch: 3462,
          rewards: [
            { funded: '2000000000000000000', priceUsd: '0.5', token: hemi },
            { funded: '10000000', priceUsd: '100000', token: hemiBtc },
          ],
          settled: true,
          timestamp: 100,
        },
        {
          epoch: 3463,
          rewards: [
            { funded: '4000000000000000000', priceUsd: '0.25', token: hemi },
            { funded: '0', priceUsd: '100000', token: hemiBtc },
          ],
          settled: false,
          timestamp: 200,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series).toEqual([
      {
        color: '#FF4600',
        points: [
          {
            projected: false,
            settled: true,
            timestamp: 100_000,
            x: 3462,
            y: 1,
          },
          {
            projected: false,
            settled: false,
            timestamp: 200_000,
            x: 3463,
            y: 1,
          },
        ],
        symbol: 'HEMI',
      },
      {
        color: '#009CF5',
        points: [
          {
            projected: false,
            settled: true,
            timestamp: 100_000,
            x: 3462,
            y: 10_000,
          },
          {
            projected: false,
            settled: false,
            timestamp: 200_000,
            x: 3463,
            y: 0,
          },
        ],
        symbol: 'hemiBTC',
      },
    ])
  })

  it('counts an amount without a price as zero', async function () {
    const [series] = await toRewardsSeries({
      epochs: [
        {
          epoch: 3462,
          rewards: [
            { funded: '2000000000000000000', priceUsd: null, token: hemi },
          ],
          settled: true,
          timestamp: 100,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series.points).toEqual([
      {
        projected: false,
        settled: true,
        timestamp: 100_000,
        x: 3462,
        y: 0,
      },
    ])
  })

  it('includes a token that is not in the token list', async function () {
    const series = await toRewardsSeries({
      epochs: [
        {
          epoch: 3462,
          rewards: [
            { funded: '3000000000000000000', priceUsd: '1', token: unknown },
            { funded: '2000000000000000000', priceUsd: '1', token: hemi },
          ],
          settled: true,
          timestamp: 100,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series.map(({ points, symbol }) => [symbol, points[0].y])).toEqual([
      ['NEW', 3],
      ['HEMI', 2],
    ])
  })

  it('adds the baseline HEMI incentives after the last epoch, at the latest HEMI price', async function () {
    const series = await toRewardsSeries({
      epochs: [
        {
          epoch: 3459,
          rewards: [
            { funded: '0', priceUsd: '0.5', token: hemi },
            { funded: '0', priceUsd: '100000', token: hemiBtc },
          ],
          settled: true,
          timestamp: 100,
        },
        {
          epoch: 3460,
          rewards: [
            { funded: '0', priceUsd: '0.25', token: hemi },
            { funded: '0', priceUsd: '100000', token: hemiBtc },
          ],
          settled: false,
          timestamp: 200,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series.map(({ points }) => points.at(-1))).toEqual([
      {
        projected: true,
        settled: false,
        timestamp: 3462 * 525_960 * 1000,
        x: 3461,
        y: 4_166_666.66 * 0.25,
      },
      {
        projected: true,
        settled: false,
        timestamp: 3462 * 525_960 * 1000,
        x: 3461,
        y: 0,
      },
    ])
  })

  it('adds no baseline incentives before their first epoch', async function () {
    const [series] = await toRewardsSeries({
      epochs: [
        {
          epoch: 3400,
          rewards: [{ funded: '0', priceUsd: '1', token: hemi }],
          settled: true,
          timestamp: 100,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series.points.map(({ x }) => x)).toEqual([
      3400,
      ...Array.from({ length: 56 }, (_, i) => 3404 + i),
    ])
  })

  it('fills the rest of the period with the baseline incentives', async function () {
    const [series] = await toRewardsSeries({
      epochs: [
        {
          epoch: 3420,
          rewards: [{ funded: '0', priceUsd: '1', token: hemi }],
          settled: true,
          timestamp: 100,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1m',
    })

    expect(series.points.map(({ x }) => x)).toEqual([
      3420, 3421, 3422, 3423, 3424,
    ])
  })

  it('adds at least one epoch of baseline incentives when the period is full', async function () {
    const [series] = await toRewardsSeries({
      epochs: [3410, 3411, 3412, 3413, 3414].map(epoch => ({
        epoch,
        rewards: [{ funded: '0', priceUsd: '1', token: hemi }],
        settled: true,
        timestamp: 100,
      })),
      getToken,
      hemiAddress: hemi.address,
      period: '1m',
    })

    expect(series.points.map(({ x }) => x)).toEqual([
      3410, 3411, 3412, 3413, 3414, 3415,
    ])
  })

  it('matches each reward to its token by address, not by position', async function () {
    const series = await toRewardsSeries({
      epochs: [
        {
          epoch: 3462,
          rewards: [
            { funded: '10000000', priceUsd: '100000', token: hemiBtc },
            { funded: '2000000000000000000', priceUsd: '1', token: hemi },
          ],
          settled: true,
          timestamp: 100,
        },
        {
          epoch: 3463,
          rewards: [
            { funded: '4000000000000000000', priceUsd: '1', token: hemi },
          ],
          settled: true,
          timestamp: 200,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(
      series.map(({ points, symbol }) => [symbol, points.map(({ y }) => y)]),
    ).toEqual([
      ['hemiBTC', [10_000, 0]],
      ['HEMI', [2, 4]],
    ])
  })

  it('adds no baseline incentives without a HEMI price', async function () {
    const [series] = await toRewardsSeries({
      epochs: [
        {
          epoch: 3459,
          rewards: [{ funded: '0', priceUsd: null, token: hemi }],
          settled: true,
          timestamp: 100,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(series.points.map(({ x }) => x)).toEqual([3459])
  })

  it('carries the pre-hemiStake round on the points of every series', async function () {
    const preHemiStake = {
      from: '2025-08-30',
      fundedEpoch: 3349,
      round: 1,
      to: '2025-09-05',
    }
    const series = await toRewardsSeries({
      epochs: [
        {
          epoch: 3400,
          preHemiStake,
          rewards: [
            { funded: '2000000000000000000', priceUsd: '1', token: hemi },
            { funded: '10000000', priceUsd: '100000', token: hemiBtc },
          ],
          settled: true,
          timestamp: 100,
        },
        {
          epoch: 3462,
          rewards: [
            { funded: '2000000000000000000', priceUsd: '1', token: hemi },
            { funded: '10000000', priceUsd: '100000', token: hemiBtc },
          ],
          settled: true,
          timestamp: 200,
        },
      ],
      getToken,
      hemiAddress: hemi.address,
      period: '1y',
    })

    expect(
      series.map(({ points }) => points.map(point => point.preHemiStake)),
    ).toEqual([
      [preHemiStake, undefined],
      [preHemiStake, undefined],
    ])
  })

  it('returns no series without epochs', async function () {
    expect(
      await toRewardsSeries({
        epochs: [],
        getToken,
        hemiAddress: hemi.address,
        period: '1y',
      }),
    ).toEqual([])
  })
})
