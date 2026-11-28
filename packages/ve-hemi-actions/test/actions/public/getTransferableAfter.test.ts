import { hemi } from 'hemi-viem'
import { multicall } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { veHemiAbi } from '../../../abi'
import { getTransferableAfter } from '../../../actions/public/veHemi'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions')

describe('getTransferableAfter', function () {
  it('should read every position in a single multicall', async function () {
    const client = { chain: hemi }
    const tokenIds = [BigInt(30117), BigInt(514), BigInt(42)]
    const instants = [BigInt(1795101480), BigInt(0), BigInt(1800000000)]

    vi.mocked(multicall).mockResolvedValue(instants)

    const result = await getTransferableAfter(client, tokenIds)

    expect(result).toEqual(instants)
    expect(multicall).toHaveBeenCalledTimes(1)
    expect(multicall).toHaveBeenCalledWith(client, {
      allowFailure: false,
      contracts: tokenIds.map(tokenId => ({
        abi: veHemiAbi,
        address: getVeHemiContractAddress(hemi.id),
        args: [tokenId],
        functionName: 'transferableAfter',
      })),
    })
  })

  it('should keep the instants aligned with the ids they were asked for', async function () {
    const client = { chain: hemi }

    vi.mocked(multicall).mockResolvedValue([BigInt(7), BigInt(9)])

    const [first, second] = await getTransferableAfter(client, [
      BigInt(1),
      BigInt(2),
    ])

    expect(first).toEqual(BigInt(7))
    expect(second).toEqual(BigInt(9))
  })

  it('should not reach the chain when there is nothing to read', async function () {
    await expect(getTransferableAfter({ chain: hemi }, [])).resolves.toEqual([])
    expect(multicall).not.toHaveBeenCalled()
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      // @ts-expect-error testing invalid input
      getTransferableAfter({ chain: undefined }, [BigInt(1)]),
    ).rejects.toThrow('Client chain is not defined')
  })
})
