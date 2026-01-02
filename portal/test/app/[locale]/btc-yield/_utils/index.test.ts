import type { MerklRewards } from 'utils/merkl'
import { zeroAddress, zeroHash } from 'viem'
import { describe, expect, it } from 'vitest'

import { transformMerklRewardsToClaimParams } from '../../../../../app/[locale]/btc-yield/_utils'

describe('transformMerklRewardsToClaimParams', function () {
  it('should transform multiple merkl rewards to claim parameters', function () {
    // @ts-expect-error testing min required fields
    const mockRewards = [
      {
        amount: '1000000000000000000',
        proofs: [zeroHash, zeroHash, zeroHash],
        recipient: zeroAddress,
        token: {
          address: zeroAddress,
        },
      },
      {
        amount: '5000000000000000000',
        proofs: [zeroHash],
        recipient: zeroAddress,
        token: {
          address: zeroAddress,
        },
      },
    ] as MerklRewards

    const result = transformMerklRewardsToClaimParams(mockRewards)

    expect(result.amounts).toEqual([
      BigInt('1000000000000000000'),
      BigInt('5000000000000000000'),
    ])
    expect(result.proofs).toEqual([[zeroHash, zeroHash, zeroHash], [zeroHash]])
    expect(result.tokens).toEqual([zeroAddress, zeroAddress])
    expect(result.users).toEqual([zeroAddress, zeroAddress])
  })

  it('should handle empty rewards array', function () {
    const result = transformMerklRewardsToClaimParams([])

    expect(result.amounts).toEqual([])
    expect(result.proofs).toEqual([])
    expect(result.tokens).toEqual([])
    expect(result.users).toEqual([])
  })
})
