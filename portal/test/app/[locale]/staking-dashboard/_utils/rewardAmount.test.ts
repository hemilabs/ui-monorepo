import { formatRewardAmount } from 'app/[locale]/staking-dashboard/_utils/rewardAmount'
import { describe, expect, it } from 'vitest'

describe('formatRewardAmount', function () {
  it('renders an 8-decimal amount against 8 decimals', function () {
    // 0.96021571 hemiBTC - a real figure from the devnet's largest position.
    expect(formatRewardAmount({ amount: BigInt(96021571), decimals: 8 })).toBe(
      '0.960215',
    )
  })

  it('renders an 18-decimal amount against 18 decimals', function () {
    expect(
      formatRewardAmount({
        amount: BigInt('1185919216231734253324'),
        decimals: 18,
      }),
      // `formatNumber` keeps six significant decimals, not six decimal places, so a
      // four-figure amount is grouped and shortened rather than padded.
    ).toBe('1,185.91')
  })

  // The rule this exists for: `formatNumber` floors at six decimals, so at 8dp anything
  // under 100 base units showed as a flat `0.000000` beside a caption counting it as a
  // balance.
  it.each([
    ['one satoshi of an 8-decimal asset', BigInt(1), 8],
    ['99 base units, still not zero', BigInt(99), 8],
    ['one wei of an 18-decimal asset', BigInt(1), 18],
  ])(
    'shows %s as below the smallest figure it can print',
    function (_label, amount, decimals) {
      expect(formatRewardAmount({ amount, decimals })).toBe('<0.000001')
    },
  )

  it('shows the smallest printable figure as itself', function () {
    expect(formatRewardAmount({ amount: BigInt(100), decimals: 8 })).toBe(
      '0.000001',
    )
  })

  // A genuine zero is a real answer and must read as one.
  it('shows nothing owed as zero, not as a tiny amount', function () {
    expect(formatRewardAmount({ amount: BigInt(0), decimals: 8 })).toBe('0')
  })

  // The same integer is a different sum of money in each asset.
  it('reads the same integer differently per asset', function () {
    const amount = BigInt(100000000)
    expect(formatRewardAmount({ amount, decimals: 8 })).toBe('1')
    expect(formatRewardAmount({ amount, decimals: 18 })).toBe('<0.000001')
  })
})
