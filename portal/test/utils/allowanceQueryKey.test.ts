import { allowanceQueryKey } from '@hemilabs/react-hooks/useAllowance'
import {
  buildAllowanceQueryKey,
  normalizeTokenAddressForAllowance,
} from 'utils/allowanceQueryKey'
import { type Address, zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

const owner = '0x1111111111111111111111111111111111111111' as Address
const spender = '0x2222222222222222222222222222222222222222' as Address
const chainId = 43114
const validToken = '0x3333333333333333333333333333333333333333' as Address

describe('utils/allowanceQueryKey', function () {
  describe('normalizeTokenAddressForAllowance', function () {
    it('returns the same address when tokenAddress is a valid checksummed EVM address', function () {
      expect(normalizeTokenAddressForAllowance(validToken)).toBe(validToken)
    })

    it('returns zeroAddress when tokenAddress is not a valid 0x address (e.g. native symbol)', function () {
      expect(normalizeTokenAddressForAllowance('ETH')).toBe(zeroAddress)
      expect(normalizeTokenAddressForAllowance('')).toBe(zeroAddress)
      expect(normalizeTokenAddressForAllowance('not-an-address')).toBe(
        zeroAddress,
      )
    })
  })

  describe('buildAllowanceQueryKey', function () {
    it('matches allowanceQueryKey from the lib using normalized token address', function () {
      const key = buildAllowanceQueryKey({
        chainId,
        owner,
        spender,
        tokenAddress: validToken,
      })
      const expected = allowanceQueryKey({
        owner,
        spender,
        token: { address: validToken, chainId },
      })
      expect(key).toEqual(expected)
    })

    it('uses zeroAddress for token when tokenAddress is invalid', function () {
      const key = buildAllowanceQueryKey({
        chainId,
        owner,
        spender,
        tokenAddress: 'BTC',
      })
      const expected = allowanceQueryKey({
        owner,
        spender,
        token: { address: zeroAddress, chainId },
      })
      expect(key).toEqual(expected)
    })

    it('produces the same key for the same inputs (stable)', function () {
      const args = {
        chainId,
        owner,
        spender,
        tokenAddress: validToken,
      } as const
      expect(buildAllowanceQueryKey(args)).toEqual(buildAllowanceQueryKey(args))
    })

    it('supports undefined spender (e.g. native deposit path)', function () {
      const key = buildAllowanceQueryKey({
        chainId,
        owner,
        spender: undefined,
        tokenAddress: validToken,
      })
      const expected = allowanceQueryKey({
        owner,
        spender: undefined,
        token: { address: validToken, chainId },
      })
      expect(key).toEqual(expected)
    })
  })
})
