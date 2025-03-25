import { StakeToken } from 'types/stake'
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

      const sortedTokens = sortTokens(tokens)

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

      const sortedTokens = sortTokens(tokens)

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

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('USDT')
      expect(sortedTokens[1].symbol).toBe('DDD')
      expect(sortedTokens[2].symbol).toBe('BBB')
      expect(sortedTokens[3].symbol).toBe('AAA')
      expect(sortedTokens[4].symbol).toBe('CCC')
      expect(sortedTokens[5].symbol).toBe('ZZZ')
    })

    it('should sort tokens with balance by balance amount in descending order', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(1000), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(5000), symbol: 'BBB' }),
        createMockToken({ balance: BigInt(100), symbol: 'CCC' }),
        createMockToken({ balance: BigInt(10000), symbol: 'DDD' }),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('DDD')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('AAA')
      expect(sortedTokens[3].symbol).toBe('CCC')
    })

    it('should sort tokens without balance alphabetically', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
        createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(0), symbol: 'CCC' }),
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('CCC')
      expect(sortedTokens[3].symbol).toBe('ZZZ')
    })

    it('should correctly sort a mix of priority tokens, tokens with balance, and others', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'ZZZ' }),
        createMockToken({ balance: BigInt(100), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(0), symbol: 'hemiBTC' }),
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
        createMockToken({ balance: BigInt(1000), symbol: 'USDC' }),
        createMockToken({ balance: BigInt(500), symbol: 'CCC' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
        createMockToken({ balance: BigInt(0), symbol: 'DDD' }),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT')
      expect(sortedTokens[2].symbol).toBe('USDC')
      expect(sortedTokens[3].symbol).toBe('CCC')
      expect(sortedTokens[4].symbol).toBe('AAA')
      expect(sortedTokens[5].symbol).toBe('BBB')
      expect(sortedTokens[6].symbol).toBe('DDD')
      expect(sortedTokens[7].symbol).toBe('ZZZ')
    })

    it('should handle tokens with undefined balance', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(100), symbol: 'AAA' }),
        createMockToken({ symbol: 'BBB' }), // undefined balance
        createMockToken({ balance: BigInt(0), symbol: 'CCC' }),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('CCC')
    })

    it('should consider token decimals when comparing balances', function () {
      const token1 = {
        ...createMockToken({ symbol: 'AAA' }),
        balance: BigInt('1000000000000000000'),
        decimals: 18,
      }

      const token2 = {
        ...createMockToken({ symbol: 'BBB' }),
        balance: BigInt('10000000'),
        decimals: 6,
      }

      const sortedTokens = sortTokens([token1, token2])

      expect(sortedTokens[0].symbol).toBe('BBB')
      expect(sortedTokens[1].symbol).toBe('AAA')
    })

    it('should handle empty array', function () {
      const tokens: StakeToken[] = []
      const sortedTokens = sortTokens(tokens)
      expect(sortedTokens).toEqual([])
    })

    it('should not modify the original array', function () {
      const tokens: StakeToken[] = [
        createMockToken({ balance: BigInt(0), symbol: 'BBB' }),
        createMockToken({ balance: BigInt(0), symbol: 'AAA' }),
        createMockToken({ balance: BigInt(0), symbol: 'USDT' }),
      ]

      const originalOrder = [...tokens]
      sortTokens(tokens)

      expect(tokens[0].symbol).toBe(originalOrder[0].symbol)
      expect(tokens[1].symbol).toBe(originalOrder[1].symbol)
      expect(tokens[2].symbol).toBe(originalOrder[2].symbol)
    })
  })
})
