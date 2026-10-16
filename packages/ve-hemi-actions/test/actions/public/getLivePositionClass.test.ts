import { hemi } from 'hemi-viem'
import { multicall } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getLivePositionClass } from '../../../actions/public/veHemi'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions')

describe('getLivePositionClass', function () {
  it('should return the terms that decide the reward class', async function () {
    const client = { chain: hemi }
    const tokenId = BigInt(30117)

    vi.mocked(multicall).mockResolvedValue([true, BigInt(1795101480)])

    const result = await getLivePositionClass(client, tokenId)

    expect(result).toEqual({
      forfeitable: true,
      transferableAfter: BigInt(1795101480),
    })
    expect(multicall).toHaveBeenCalledWith(client, {
      allowFailure: false,
      contracts: [
        {
          abi: veHemiAbi,
          address: getVeHemiContractAddress(hemi.id),
          args: [tokenId],
          functionName: 'forfeitable',
        },
        {
          abi: veHemiAbi,
          address: getVeHemiContractAddress(hemi.id),
          args: [tokenId],
          functionName: 'transferableAfter',
        },
      ],
    })
  })

  it('should report no instant to wait for a position that was always transferable', async function () {
    const client = { chain: hemi }

    vi.mocked(multicall).mockResolvedValue([false, BigInt(0)])

    await expect(getLivePositionClass(client, BigInt(514))).resolves.toEqual({
      forfeitable: false,
      transferableAfter: BigInt(0),
    })
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      // @ts-expect-error testing invalid input
      getLivePositionClass({ chain: undefined }, BigInt(1)),
    ).rejects.toThrow('Client chain is not defined')
  })
})
