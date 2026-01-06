import type { MerklCampaign, MerklRewards } from 'utils/merkl'
import { unixNowTimestamp } from 'utils/time'
import { zeroAddress, zeroHash } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  formatAPRDisplay,
  getActiveCampaigns,
  getUniqueRewardTokens,
  transformMerklRewardsToClaimParams,
} from '../../../../../app/[locale]/btc-yield/_utils'

describe('utils', function () {
  describe('getActiveCampaigns', function () {
    const now = Number(unixNowTimestamp())

    const mockCampaigns: MerklCampaign[] = [
      {
        endTimestamp: now + 3600, // ends 1 hour from now (active)
      },
      {
        endTimestamp: now - 3600, // ended 1 hour ago (inactive)
      },
      {
        endTimestamp: now + 86400, // ends 1 day from now (active)
      },
      {
        endTimestamp: now, // ends exactly now (inactive)
      },
    ]

    it('should return only campaigns that end after the current timestamp', function () {
      const result = getActiveCampaigns(mockCampaigns)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockCampaigns[0])
      expect(result[1]).toEqual(mockCampaigns[2])
    })

    it('should return empty array when campaigns is undefined', function () {
      const result = getActiveCampaigns(undefined)

      expect(result).toHaveLength(0)
    })

    it('should return empty array when campaigns is empty', function () {
      const result = getActiveCampaigns([])

      expect(result).toHaveLength(0)
    })

    it('should return all campaigns when all are active', function () {
      const allActiveCampaigns = mockCampaigns.map(campaign => ({
        ...campaign,
        endTimestamp: now + 3600, // all end 1 hour from now
      }))

      const result = getActiveCampaigns(allActiveCampaigns)

      expect(result).toHaveLength(4)
    })

    it('should return empty array when all campaigns have ended', function () {
      const allEndedCampaigns = mockCampaigns.map(campaign => ({
        ...campaign,
        endTimestamp: now - 3600, // all ended 1 hour ago
      }))

      const result = getActiveCampaigns(allEndedCampaigns)

      expect(result).toHaveLength(0)
    })
  })

  describe('getUniqueRewardTokens', function () {
    it('should return unique reward tokens from campaigns', function () {
      const mockCampaigns = [
        {
          rewardToken: {
            address: zeroAddress,
            chainId: 1,
            symbol: 'TOKEN1',
          },
        },
        {
          rewardToken: {
            address: '0x1234567890123456789012345678901234567890',
            chainId: 1,
            symbol: 'TOKEN2',
          },
        },
        {
          rewardToken: {
            address: zeroAddress, // duplicate address but different chainId
            chainId: 137,
            symbol: 'TOKEN1',
          },
        },
        {
          rewardToken: {
            address: zeroAddress, // exact duplicate
            chainId: 1,
            symbol: 'TOKEN1',
          },
        },
      ]

      // @ts-expect-error testing min required fields
      const result = getUniqueRewardTokens(mockCampaigns)

      expect(result).toHaveLength(3)
      expect(result).toEqual([
        mockCampaigns[0].rewardToken,
        mockCampaigns[1].rewardToken,
        mockCampaigns[2].rewardToken,
      ])
    })

    it('should return empty array when campaigns is undefined', function () {
      const result = getUniqueRewardTokens(undefined)
      expect(result).toHaveLength(0)
    })

    it('should return empty array when campaigns is empty', function () {
      const result = getUniqueRewardTokens([])
      expect(result).toHaveLength(0)
    })

    it('should handle campaigns with same token on same chain', function () {
      const mockCampaigns = [
        {
          rewardToken: {
            address: zeroAddress,
            chainId: 1,
            symbol: 'SAME_TOKEN',
          },
        },
        {
          rewardToken: {
            address: zeroAddress,
            chainId: 1,
            symbol: 'SAME_TOKEN',
          },
        },
      ]

      // @ts-expect-error testing min required fields
      const result = getUniqueRewardTokens(mockCampaigns)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockCampaigns[0].rewardToken)
    })
  })

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
      expect(result.proofs).toEqual([
        [zeroHash, zeroHash, zeroHash],
        [zeroHash],
      ])
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

  describe('formatAPRDisplay', function () {
    it('should return "< 0.01%" for values less than 0.01', function () {
      expect(formatAPRDisplay(0.005)).toBe('< 0.01%')
    })

    it('should format percentage for value equal to 0.01', function () {
      expect(formatAPRDisplay(0.01)).toBe('0.01%')
    })

    it('should format percentage for larger values', function () {
      expect(formatAPRDisplay(5.25)).toBe('5.25%')
    })
  })
})
