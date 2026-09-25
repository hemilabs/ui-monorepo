import fetchPlusPlus from 'fetch-plus-plus'
import { hemiSepolia } from 'hemi-viem'
import { getLockedPositions } from 'utils/subgraph'
import { zeroAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({
  default: vi.fn(),
}))

describe('utils/subgraph', function () {
  describe('getLockedPositions', function () {
    it('should parse the serialized numeric fields into bigints', async function () {
      vi.mocked(fetchPlusPlus).mockResolvedValue({
        positions: [
          {
            amount: '1000',
            blockNumber: '2',
            blockTimestamp: '3',
            lockTime: '4',
            timestamp: '5',
            tokenId: '6',
          },
        ],
      })

      const [position] = await getLockedPositions({
        address: zeroAddress,
        chainId: hemiSepolia.id,
      })

      expect(position.amount).toBe(BigInt(1000))
      expect(position.blockNumber).toBe(BigInt(2))
      expect(position.tokenId).toBe(BigInt(6))

      expect(vi.mocked(fetchPlusPlus)).toHaveBeenCalledWith(
        expect.stringContaining(
          `/subgraphs/${hemiSepolia.id}/locks/${zeroAddress}`,
        ),
        expect.anything(),
      )
    })

    it('should return an empty list when the address has no positions', async function () {
      vi.mocked(fetchPlusPlus).mockResolvedValue({ positions: [] })

      await expect(
        getLockedPositions({ address: zeroAddress, chainId: hemiSepolia.id }),
      ).resolves.toEqual([])
    })

    it('should reject when the request fails, instead of resolving empty', async function () {
      vi.mocked(fetchPlusPlus).mockRejectedValue(
        new Error('Service Unavailable'),
      )

      await expect(
        getLockedPositions({ address: zeroAddress, chainId: hemiSepolia.id }),
      ).rejects.toThrow('Service Unavailable')
    })
  })
})
