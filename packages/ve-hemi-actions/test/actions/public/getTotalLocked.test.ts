import { hemi } from 'hemi-viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getTotalLocked } from '../../../actions/public/getTotalLocked'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions')

describe('getTotalLocked', function () {
  it('should return the total amount of HEMI locked', async function () {
    const client = { chain: hemi }
    const totalLocked = BigInt('1488392826436605230000147341')

    vi.mocked(readContract).mockResolvedValue(totalLocked)

    const result = await getTotalLocked(client)

    expect(result).toBe(totalLocked)
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: veHemiAbi,
      address: getVeHemiContractAddress(hemi.id),
      functionName: 'totalLocked',
    })
  })

  it('should throw error when client is not defined', async function () {
    // @ts-expect-error testing invalid input
    await expect(getTotalLocked(undefined)).rejects.toThrow(
      'Client is not defined',
    )
  })

  it('should throw error when client chain is not defined', async function () {
    // @ts-expect-error testing invalid input
    await expect(getTotalLocked({ chain: undefined })).rejects.toThrow(
      'Client chain is not defined',
    )
  })
})
