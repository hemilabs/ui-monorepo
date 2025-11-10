import fetchPlusPlus from 'fetch-plus-plus'
import { hemiSepolia } from 'hemi-viem'
import { getTokenHolders } from 'utils/explorerApi'
import { zeroAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({
  default: vi.fn(),
}))

describe('utils/explorerApi', function () {
  describe('getTokenHolders', function () {
    it('should return the correct number of token holders', async function () {
      const mockResponse = { token_holders_count: '42' }
      vi.mocked(fetchPlusPlus).mockResolvedValue(mockResponse)

      const result = await getTokenHolders({
        address: zeroAddress,
        hemi: hemiSepolia,
      })

      expect(result).toBe(42)
    })

    it('should throw an error when response is undefined', async function () {
      vi.mocked(fetchPlusPlus).mockResolvedValue(undefined)

      await expect(
        getTokenHolders({
          address: zeroAddress,
          hemi: hemiSepolia,
        }),
      ).rejects.toThrow('Invalid token holders from block explorer')
    })

    it('should throw an error when token_holders_count is undefined', async function () {
      const mockResponse = {}
      vi.mocked(fetchPlusPlus).mockResolvedValue(mockResponse)

      await expect(
        getTokenHolders({
          address: zeroAddress,
          hemi: hemiSepolia,
        }),
      ).rejects.toThrow('Invalid token holders from block explorer')
    })
  })
})
