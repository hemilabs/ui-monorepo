import { StakeToken } from 'types/stake'
import { sortTokens } from 'utils/sortTokens'
import { describe, expect, it } from 'vitest'

const createMockToken = (
  symbol: string,
  balance?: bigint,
  address = `0x${symbol.toLowerCase().padEnd(40, '0')}`,
  chainId = 43111,
  decimals = 18,
  // eslint-disable-next-line max-params
): StakeToken => ({
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
})

describe('utils/sortTokens', function () {
  describe('sortTokens', function () {
    it('should place hemiBTC, USDT, USDC at the top in that order', function () {
      const tokens: StakeToken[] = [
        createMockToken('DAI', BigInt(1000000)),
        createMockToken('USDC', BigInt(0)),
        createMockToken('USDT', BigInt(0)),
        createMockToken('LINK', BigInt(0)),
        createMockToken('hemiBTC', BigInt(0)),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT')
      expect(sortedTokens[2].symbol).toBe('USDC')
    })

    it('should treat tokens with .e suffix the same as their base symbol for priority ordering', function () {
      const tokens: StakeToken[] = [
        createMockToken('USDC.e', BigInt(0)),
        createMockToken('DAI', BigInt(0)),
        createMockToken('USDT.e', BigInt(0)),
        createMockToken('hemiBTC', BigInt(0)),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT.e')
      expect(sortedTokens[2].symbol).toBe('USDC.e')
    })

    it('should place tokens with balance after priority tokens and before those without balance', function () {
      const tokens: StakeToken[] = [
        createMockToken('ZZZ', BigInt(0)),
        createMockToken('AAA', BigInt(0)),
        createMockToken('BBB', BigInt(1000)),
        createMockToken('USDT', BigInt(0)),
        createMockToken('CCC', BigInt(0)),
        createMockToken('DDD', BigInt(5000)),
      ]

      const sortedTokens = sortTokens(tokens)

      // USDT should be first (priority token)
      expect(sortedTokens[0].symbol).toBe('USDT')

      // DDD and BBB should be next (have balance)
      expect(sortedTokens[1].symbol).toBe('DDD')
      expect(sortedTokens[2].symbol).toBe('BBB')

      // The rest should be alphabetical
      expect(sortedTokens[3].symbol).toBe('AAA')
      expect(sortedTokens[4].symbol).toBe('CCC')
      expect(sortedTokens[5].symbol).toBe('ZZZ')
    })

    it('should sort tokens with balance by balance amount in descending order', function () {
      const tokens: StakeToken[] = [
        createMockToken('AAA', BigInt(1000)),
        createMockToken('BBB', BigInt(5000)),
        createMockToken('CCC', BigInt(100)),
        createMockToken('DDD', BigInt(10000)),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('DDD')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('AAA')
      expect(sortedTokens[3].symbol).toBe('CCC')
    })

    it('should sort tokens without balance alphabetically', function () {
      const tokens: StakeToken[] = [
        createMockToken('ZZZ', BigInt(0)),
        createMockToken('AAA', BigInt(0)),
        createMockToken('CCC', BigInt(0)),
        createMockToken('BBB', BigInt(0)),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('CCC')
      expect(sortedTokens[3].symbol).toBe('ZZZ')
    })

    it('should correctly sort a mix of priority tokens, tokens with balance, and others', function () {
      const tokens: StakeToken[] = [
        createMockToken('ZZZ', BigInt(0)),
        createMockToken('AAA', BigInt(100)),
        createMockToken('hemiBTC', BigInt(0)),
        createMockToken('BBB', BigInt(0)),
        createMockToken('USDC', BigInt(1000)),
        createMockToken('CCC', BigInt(500)),
        createMockToken('USDT', BigInt(0)),
        createMockToken('DDD', BigInt(0)),
      ]

      const sortedTokens = sortTokens(tokens)

      // Priority tokens first, in specified order
      expect(sortedTokens[0].symbol).toBe('hemiBTC')
      expect(sortedTokens[1].symbol).toBe('USDT')
      expect(sortedTokens[2].symbol).toBe('USDC')

      // Then tokens with balance, by amount descending
      expect(sortedTokens[3].symbol).toBe('CCC')
      expect(sortedTokens[4].symbol).toBe('AAA')

      // Then alphabetical
      expect(sortedTokens[5].symbol).toBe('BBB')
      expect(sortedTokens[6].symbol).toBe('DDD')
      expect(sortedTokens[7].symbol).toBe('ZZZ')
    })

    it('should handle tokens with undefined balance', function () {
      const tokens: StakeToken[] = [
        createMockToken('AAA', BigInt(100)),
        createMockToken('BBB'), // undefined balance
        createMockToken('CCC', BigInt(0)),
      ]

      const sortedTokens = sortTokens(tokens)

      expect(sortedTokens[0].symbol).toBe('AAA')
      expect(sortedTokens[1].symbol).toBe('BBB')
      expect(sortedTokens[2].symbol).toBe('CCC')
    })

    it('should consider token decimals when comparing balances', function () {
      const token1 = {
        ...createMockToken('AAA'),
        balance: BigInt('1000000000000000000'),
        decimals: 18,
      }

      const token2 = {
        ...createMockToken('BBB'),
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
        createMockToken('BBB', BigInt(0)),
        createMockToken('AAA', BigInt(0)),
        createMockToken('USDT', BigInt(0)),
      ]

      const originalOrder = [...tokens]
      sortTokens(tokens)

      expect(tokens[0].symbol).toBe(originalOrder[0].symbol)
      expect(tokens[1].symbol).toBe(originalOrder[1].symbol)
      expect(tokens[2].symbol).toBe(originalOrder[2].symbol)
    })
  })
})
