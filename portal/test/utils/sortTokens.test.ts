import { priorityStakeTokensToSort, StakeToken } from 'types/stake'
import { sortTokens } from 'utils/sortTokens'
import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

const createMockToken = function (params: {
  symbol: string
  balance?: bigint
  address?: string
  chainId?: number
  decimals?: number
}): StakeToken {
  const {
    address = zeroAddress,
    balance,
    chainId = 43111,
    decimals = 18,
    symbol,
  } = params ?? {}
  return {
    address,
    balance,
    chainId,
    decimals,
    extensions: {
      protocol: 'hemi',
      rewards: [],
      website: 'https://example.com',
    },
    logoURI: '',
    name: symbol,
    symbol,
  }
}

const mockPrices: Record<string, string> = {
  'AAA': '5',
  'BBB': '10',
  'CCC': '2',
  'DAI': '1',
  'DDD': '1',
  'hemiBTC': '30000',
  'LINK': '15',
  'USDC': '1',
  'USDC.e': '1',
  'USDT': '1',
  'USDT.e': '1',
  'ZZZ': '7',
}

describe('utils/sortTokens', function () {
  describe('sortTokens', function () {
    it('should place hemiBTC, USDT, USDC at the top in that order', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(1000000), symbol: 'DAI' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDC' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
        createMockToken({ balance: BigInt(0), symbol: 'LINK' }),
        createMockToken({ balance: BigInt(0), symbol: 'hemiBTC' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT')
      expect(sortedTokens[2].symbol).toBe('USDC')
    })

    it('should treat tokens with .e suffix the same as their base symbol for priority ordering', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'USDC.e' }),
        createMockToken({ balance: BigInt(0), symbol: 'DAI' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT.e' }),
        createMockToken({ balance: BigInt(0), symbol: 'hemiBTC' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT.e')
      expect(sortedTokens[2].symbol).toBe('USDC.e')
    })

    it('should place tokens with balance after priority tokens and before those without balance', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
        createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(1000), symbol: 'BBB' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
        createMockToken({ balance: BigInt(0), symbol: 'CCC' }),
        createMockToken({ balance: BigInt(5000), symbol: 'DDD' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('USDT')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('DDD')
      expect(
        sortedTokens
          .slice(3)
          .map(t => t.symbol)
          .sort(),
      ).toEqual(['AAA', 'CCC', 'ZZZ'].sort())
    })

    it('should sort tokens with balance by USD value in descending order', function () {
      const tokens: StakeToken[] = [
        createMockToken({
          balance: BigInt('100000000000000000'),
          symbol: 'AAA',
        }),
        createMockToken({
          balance: BigInt('30000000000000000'),
          symbol: 'BBB',
        }),
        createMockToken({
          balance: BigInt('1000000000000000000'),
          symbol: 'CCC',
        }),
        createMockToken({
          balance: BigInt('100000000000000000'),
          symbol: 'DDD',
        }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('CCC')
      expect(sortedTokens[1].symbol).toBe('AAA')
      expect(sortedTokens[2].symbol).toBe('BBB')
      expect(sortedTokens[3].symbol).toBe('DDD')
    })

    it('should sort tokens without balance alphabetically', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
        createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(0), symbol: 'CCC' }),
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('CCC')
      expect(sortedTokens[3].symbol).toBe('ZZZ')
    })

    it('should correctly sort a mix of priority tokens, tokens with balance, and others', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
        createMockToken({
          balance: BigInt('1000000000000000000'),
          symbol: 'AAA',
        }), // 1 AAA = $5
        createMockToken({ balance: BigInt(0), symbol: 'hemiBTC' }),
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
        createMockToken({
          balance: BigInt('1000000000000000000'),
          symbol: 'USDC',
        }),
        createMockToken({
          balance: BigInt('1000000000000000000'),
          symbol: 'CCC',
        }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
        createMockToken({ balance: BigInt(0), symbol: 'DDD' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT')
      expect(sortedTokens[2].symbol).toBe('USDC')
      expect(sortedTokens[3].symbol).toBe('AAA')
      expect(sortedTokens[4].symbol).toBe('CCC')
      expect(
        sortedTokens
          .slice(5)
          .map(t => t.symbol)
          .sort(),
      ).toEqual(['BBB', 'DDD', 'ZZZ'].sort())
    })

    it('should handle tokens with undefined balance', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(100), symbol: 'AAA' }),
        createMockToken({ symbol: 'BBB' }), // undefined balance
        createMockToken({ balance: BigInt(0), symbol: 'CCC' }),
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(
        sortedTokens
          .slice(1)
          .map(t => t.symbol)
          .sort(),
      ).toEqual(['BBB', 'CCC'].sort())
    })

    it('should sort based on USD value not just token amount', function () {
      const tokens: StakeToken[] = [
        {
          ...createMockToken({ symbol: 'DAI' }),
          balance: BigInt('500000000000000000'),
          decimals: 18,
        },
        {
          ...createMockToken({ symbol: 'BBB' }),
          balance: BigInt('10000000000000'),
          decimals: 18,
        },
        {
          ...createMockToken({ symbol: 'AAA' }),
          balance: BigInt('100000000000000000'),
          decimals: 18,
        },
      ]

      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      const topSymbols = [sortedTokens[0].symbol, sortedTokens[1].symbol].sort()
      expect(topSymbols).toEqual(['AAA', 'DAI'].sort())
      expect(sortedTokens[2].symbol).toBe('BBB')
    })

    it('should handle empty array', function () {
      const tokens: StakeToken[] = []
      const sortedTokens = sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })
      expect(sortedTokens).toEqual([])
    })

    it('should not modify the original array', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
        createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
      ]

      const originalOrder = [...tokens]
      sortTokens({
        prices: mockPrices,
        prioritySymbols: priorityStakeTokensToSort,
        tokens,
      })

      expect(tokens[0].symbol).toBe(originalOrder[0].symbol)
      expect(tokens[1].symbol).toBe(originalOrder[1].symbol)
      expect(tokens[2].symbol).toBe(originalOrder[2].symbol)
    })
  })

  it('should sort tokens by USD value when no prioritySymbols are provided', function () {
    const tokens: StakeToken[] = [
      createMockToken({
        balance: BigInt('1000000000000000000'),
        symbol: 'CCC',
      }),
      createMockToken({
        balance: BigInt('100000000000000000'),
        symbol: 'AAA',
      }),
      createMockToken({
        balance: BigInt('100000000000000000'),
        symbol: 'BBB',
      }),
    ]

    const sortedTokens = sortTokens({
      prices: mockPrices,
      tokens,
    })

    expect(sortedTokens[0].symbol).toBe('CCC')
    expect(sortedTokens[1].symbol).toBe('BBB')
    expect(sortedTokens[2].symbol).toBe('AAA')
  })

  it('should sort tokens alphabetically if no balances and no prioritySymbols are provided', function () {
    const tokens: StakeToken[] = [
      createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
      createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
      createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
    ]

    const sortedTokens = sortTokens({
      prices: mockPrices,
      tokens,
    })

    expect(sortedTokens.map(t => t.symbol)).toEqual(['AAA', 'BBB', 'ZZZ'])
  })

  it('should sort by balance first (USD descending), then alphabetically without prioritySymbols', function () {
    const tokens: StakeToken[] = [
      createMockToken({
        balance: BigInt('1000000000000000000'),
        symbol: 'AAA',
      }),
      createMockToken({
        balance: BigInt(0),
        symbol: 'ZZZ',
      }),
      createMockToken({
        balance: BigInt('100000000000000000'),
        symbol: 'BBB',
      }),
      createMockToken({
        balance: BigInt(0),
        symbol: 'CCC',
      }),
    ]

    const sortedTokens = sortTokens({
      prices: mockPrices,
      tokens,
    })

    expect(sortedTokens[0].symbol).toBe('AAA')
    expect(sortedTokens[1].symbol).toBe('BBB')
    expect(sortedTokens.slice(2).map(t => t.symbol)).toEqual(['CCC', 'ZZZ'])
  })
})
