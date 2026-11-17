import { RewardSource, type ClaimableReward } from 'types/stakingDashboard'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import {
  getClaimTransactions,
  getClaimWindows,
  markClaimWindowAsClaimed,
  mergeClaimableRewards,
  sortClaimsByValue,
} from '../../../../../app/[locale]/hemi-stake/_utils/claimableRewards'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

const hemi: Address = '0x1111111111111111111111111111111111111111'
const usdc: Address = '0x2222222222222222222222222222222222222222'

const reward = (
  token: Address,
  amount: bigint,
  overrides: Partial<ClaimableReward> = {},
): ClaimableReward => ({
  amount,
  decimals: 18,
  source: RewardSource.EPOCH,
  token,
  ...overrides,
})

describe('mergeClaimableRewards', function () {
  it('should return an empty list when no source owes anything', function () {
    expect(mergeClaimableRewards([])).toEqual([])
    expect(mergeClaimableRewards([[], []])).toEqual([])
  })

  it('should keep one row per reward token', function () {
    const merged = mergeClaimableRewards([
      [reward(hemi, BigInt(5)), reward(usdc, BigInt(7))],
    ])

    expect(merged).toHaveLength(2)
  })

  it('should add up what every source owes for the same token', function () {
    const merged = mergeClaimableRewards([
      [reward(hemi, BigInt(5))],
      [reward(hemi, BigInt(3))],
    ])

    expect(merged).toEqual([reward(hemi, BigInt(8))])
  })

  it('should keep the metadata of the first row it saw for a token', function () {
    const merged = mergeClaimableRewards([
      [reward(hemi, BigInt(5), { decimals: 8 })],
      [reward(hemi, BigInt(3), { decimals: 18 })],
    ])

    expect(merged).toEqual([reward(hemi, BigInt(8), { decimals: 8 })])
  })

  it('should keep a token that is owed nothing', function () {
    const merged = mergeClaimableRewards([
      [reward(hemi, BigInt(0)), reward(usdc, BigInt(4))],
    ])

    expect(merged).toHaveLength(2)
  })
})

describe('getClaimWindows', function () {
  const bounds = { maxClaimEpochs: 64, maxClaimPairs: 96 }

  it('should return no window when the range is empty', function () {
    expect(
      getClaimWindows({ ...bounds, fromEpoch: 10, toEpoch: 9, tokenCount: 1 }),
    ).toEqual([])
  })

  it('should return a single window when the range fits in one claim', function () {
    expect(
      getClaimWindows({ ...bounds, fromEpoch: 10, toEpoch: 20, tokenCount: 1 }),
    ).toEqual([{ fromEpoch: 10, toEpoch: 20 }])
  })

  it('should split the range on the epoch bound', function () {
    const windows = getClaimWindows({
      ...bounds,
      fromEpoch: 0,
      toEpoch: 100,
      tokenCount: 1,
    })

    expect(windows).toEqual([
      { fromEpoch: 0, toEpoch: 63 },
      { fromEpoch: 64, toEpoch: 100 },
    ])
  })

  it('should narrow the window as the registry grows', function () {
    const windows = getClaimWindows({
      ...bounds,
      fromEpoch: 0,
      toEpoch: 100,
      tokenCount: 4,
    })

    // 96 pairs over 4 tokens is 24 epochs a claim.
    expect(windows).toEqual([
      { fromEpoch: 0, toEpoch: 23 },
      { fromEpoch: 24, toEpoch: 47 },
      { fromEpoch: 48, toEpoch: 71 },
      { fromEpoch: 72, toEpoch: 95 },
      { fromEpoch: 96, toEpoch: 100 },
    ])
  })

  it('should return one window for a range of one epoch', function () {
    expect(
      getClaimWindows({ ...bounds, fromEpoch: 40, toEpoch: 40, tokenCount: 2 }),
    ).toEqual([{ fromEpoch: 40, toEpoch: 40 }])
  })

  // A registry wider than the pair bound would divide to zero epochs a claim, which is
  // a window nobody can ever claim through. One epoch at a time is the floor.
  it('should still carry one epoch when the registry outgrows the pair bound', function () {
    expect(
      getClaimWindows({
        ...bounds,
        fromEpoch: 10,
        toEpoch: 12,
        tokenCount: 200,
      }),
    ).toEqual([
      { fromEpoch: 10, toEpoch: 10 },
      { fromEpoch: 11, toEpoch: 11 },
      { fromEpoch: 12, toEpoch: 12 },
    ])
  })

  it('should fall back to the epoch bound when no token is registered', function () {
    expect(
      getClaimWindows({ ...bounds, fromEpoch: 0, toEpoch: 70, tokenCount: 0 }),
    ).toEqual([
      { fromEpoch: 0, toEpoch: 63 },
      { fromEpoch: 64, toEpoch: 70 },
    ])
  })

  it('should plan the whole history of a two-token deployment', function () {
    const windows = getClaimWindows({
      ...bounds,
      fromEpoch: 3002,
      toEpoch: 3401,
      tokenCount: 2,
    })

    expect(windows).toHaveLength(9)
    expect(windows.at(0)).toEqual({ fromEpoch: 3002, toEpoch: 3049 })
    expect(windows.at(-1)).toEqual({ fromEpoch: 3386, toEpoch: 3401 })
  })
})

describe('getClaimTransactions', function () {
  it('should leave out the windows that owe nothing', function () {
    const transactions = getClaimTransactions([
      { fromEpoch: 0, rewards: [reward(hemi, BigInt(0))], toEpoch: 63 },
      { fromEpoch: 64, rewards: [reward(hemi, BigInt(9))], toEpoch: 100 },
    ])

    expect(transactions).toEqual([
      {
        fromEpoch: 64,
        rewards: [reward(hemi, BigInt(9))],
        source: RewardSource.EPOCH,
        toEpoch: 100,
      },
    ])
  })

  it('should keep a window where any reward token owes something', function () {
    const transactions = getClaimTransactions([
      {
        fromEpoch: 0,
        rewards: [reward(hemi, BigInt(0)), reward(usdc, BigInt(1))],
        toEpoch: 63,
      },
    ])

    expect(transactions).toHaveLength(1)
  })

  it('should ask for nothing when no window owes anything', function () {
    expect(
      getClaimTransactions([
        { fromEpoch: 3002, rewards: [reward(hemi, BigInt(0))], toEpoch: 3049 },
        { fromEpoch: 3050, rewards: [], toEpoch: 3097 },
      ]),
    ).toEqual([])
  })

  it('should ask for one transaction per window that pays', function () {
    const transactions = getClaimTransactions([
      { fromEpoch: 3338, rewards: [reward(hemi, BigInt(405))], toEpoch: 3385 },
      { fromEpoch: 3386, rewards: [reward(hemi, BigInt(723))], toEpoch: 3401 },
    ])

    expect(transactions).toEqual([
      {
        fromEpoch: 3338,
        rewards: [reward(hemi, BigInt(405))],
        source: RewardSource.EPOCH,
        toEpoch: 3385,
      },
      {
        fromEpoch: 3386,
        rewards: [reward(hemi, BigInt(723))],
        source: RewardSource.EPOCH,
        toEpoch: 3401,
      },
    ])
  })

  it('should ask only for what a partly claimed position still owes', function () {
    const transactions = getClaimTransactions([
      { fromEpoch: 3338, rewards: [reward(hemi, BigInt(0))], toEpoch: 3385 },
      { fromEpoch: 3386, rewards: [reward(hemi, BigInt(723))], toEpoch: 3401 },
    ])

    expect(transactions).toEqual([
      {
        fromEpoch: 3386,
        rewards: [reward(hemi, BigInt(723))],
        source: RewardSource.EPOCH,
        toEpoch: 3401,
      },
    ])
  })
})

describe('sortClaimsByValue', function () {
  const tokens = [
    { address: hemi, decimals: 18, symbol: 'HEMI' },
    { address: usdc, decimals: 18, symbol: 'USDC' },
  ]

  const claim = (
    tokenId: number,
    fromEpoch: number,
    rewards: ClaimableReward[],
  ) => ({ fromEpoch, rewards, tokenId: BigInt(tokenId) })

  const order = (claims: { fromEpoch: number; tokenId: bigint }[]) =>
    claims.map(({ fromEpoch, tokenId }) => [Number(tokenId), fromEpoch])

  it('should send the most valuable window first, across positions', function () {
    const sorted = sortClaimsByValue({
      claims: [
        claim(1, 0, [reward(hemi, BigInt(1))]),
        claim(1, 64, [reward(usdc, BigInt(1))]),
        claim(2, 0, [reward(hemi, BigInt(1)), reward(usdc, BigInt(1))]),
      ],
      hemiTokenAddress: hemi,
      prices: { HEMI: '0.1', USDC: '1' },
      tokens,
    })

    expect(order(sorted)).toEqual([
      [2, 0],
      [1, 64],
      [1, 0],
    ])
  })

  it('should rank by the HEMI amount when prices are not loaded', function () {
    const sorted = sortClaimsByValue({
      claims: [
        claim(1, 0, [reward(usdc, BigInt(1000))]),
        claim(1, 64, [reward(hemi, BigInt(2))]),
        claim(2, 0, [reward(hemi, BigInt(5))]),
      ],
      hemiTokenAddress: hemi,
      prices: undefined,
      tokens,
    })

    expect(order(sorted)).toEqual([
      [2, 0],
      [1, 64],
      [1, 0],
    ])
  })

  it('should count a reward token without a price as worth nothing', function () {
    const sorted = sortClaimsByValue({
      claims: [
        claim(1, 0, [reward(usdc, BigInt(1000))]),
        claim(1, 64, [reward(hemi, BigInt(1))]),
      ],
      hemiTokenAddress: hemi,
      prices: { HEMI: '0.1' },
      tokens,
    })

    expect(order(sorted)).toEqual([
      [1, 64],
      [1, 0],
    ])
  })

  it('should break ties by position, then by epoch', function () {
    const sorted = sortClaimsByValue({
      claims: [
        claim(2, 0, [reward(hemi, BigInt(1))]),
        claim(1, 64, [reward(hemi, BigInt(1))]),
        claim(1, 0, [reward(hemi, BigInt(1))]),
      ],
      hemiTokenAddress: hemi,
      prices: { HEMI: '0.1' },
      tokens,
    })

    expect(order(sorted)).toEqual([
      [1, 0],
      [1, 64],
      [2, 0],
    ])
  })
})

describe('markClaimWindowAsClaimed', function () {
  const windows = [
    { fromEpoch: 1, rewards: [reward(hemi, BigInt(5))], toEpoch: 10 },
    {
      fromEpoch: 11,
      rewards: [reward(hemi, BigInt(3)), reward(usdc, BigInt(7))],
      toEpoch: 20,
    },
  ]

  it('zeroes every reward of the claimed window', function () {
    const result = markClaimWindowAsClaimed(windows, {
      fromEpoch: 11,
      toEpoch: 20,
    })

    expect(result[1].rewards).toEqual([
      reward(hemi, BigInt(0)),
      reward(usdc, BigInt(0)),
    ])
  })

  it('leaves the other windows untouched', function () {
    const result = markClaimWindowAsClaimed(windows, {
      fromEpoch: 11,
      toEpoch: 20,
    })

    expect(result[0]).toBe(windows[0])
  })

  it('drops the claimed window from the claim transactions', function () {
    const result = markClaimWindowAsClaimed(windows, {
      fromEpoch: 1,
      toEpoch: 10,
    })

    expect(getClaimTransactions(result)).toEqual([
      {
        fromEpoch: 11,
        rewards: [reward(hemi, BigInt(3)), reward(usdc, BigInt(7))],
        source: RewardSource.EPOCH,
        toEpoch: 20,
      },
    ])
  })

  it('returns the windows unchanged when none matches', function () {
    const result = markClaimWindowAsClaimed(windows, {
      fromEpoch: 1,
      toEpoch: 20,
    })

    expect(result).toEqual(windows)
  })

  it('does not mutate the input', function () {
    markClaimWindowAsClaimed(windows, { fromEpoch: 1, toEpoch: 10 })

    expect(windows[0].rewards[0].amount).toBe(BigInt(5))
  })
})
