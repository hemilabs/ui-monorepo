import { hemiSepolia } from 'hemi-viem'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'
import { sepolia } from 'viem/chains'
import { describe, expect, it } from 'vitest'

describe('utils/fallbackPriorityFee', function () {
  describe('getFallbackPriorityFeeForChain', function () {
    it('should return the Hemi Sepolia default for Hemi Sepolia chain id', function () {
      expect(getFallbackPriorityFeeForChain(hemiSepolia.id)).toBe(
        BigInt(100_000),
      )
    })

    it('should return 1 gwei for other chains', function () {
      expect(getFallbackPriorityFeeForChain(sepolia.id)).toBe(
        BigInt(1_000_000_000),
      )
    })
  })
})
