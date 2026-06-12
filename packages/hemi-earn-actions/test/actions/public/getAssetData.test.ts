import { type Address, type Client, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getAssetData } from '../../../src/actions/public/getAssetData'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}))

const client = {} as Client
const routerAddress = '0x000000000000000000000000000000000000bEEf' as Address
const asset = '0x000000000000000000000000000000000000dEaD' as Address
const share = '0x000000000000000000000000000000000000Beef' as Address
const remoteAsset = '0x000000000000000000000000000000000000c0DE' as Address
const remoteShare = '0x000000000000000000000000000000000000fEED' as Address

describe('getAssetData', function () {
  it('forwards the asset to `assetsData` and returns the struct', async function () {
    vi.mocked(readContract).mockResolvedValue({
      enabled: true,
      remoteAsset,
      remoteShare,
      share,
    })

    const result = await getAssetData(client, { asset, routerAddress })

    expect(result).toEqual({
      enabled: true,
      remoteAsset,
      remoteShare,
      share,
    })
    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: routerAddress,
        args: [asset],
        functionName: 'assetsData',
      }),
    )
  })

  it('preserves enabled=false for disabled assets', async function () {
    vi.mocked(readContract).mockResolvedValue({
      enabled: false,
      remoteAsset,
      remoteShare,
      share,
    })

    const result = await getAssetData(client, { asset, routerAddress })

    expect(result.enabled).toBe(false)
  })

  it('rejects a zero `asset`', async function () {
    await expect(
      getAssetData(client, { asset: zeroAddress, routerAddress }),
    ).rejects.toThrow(/`asset` cannot be the zero address/)
  })

  it('rejects an undefined `client`', async function () {
    await expect(
      getAssetData(undefined as unknown as Client, { asset, routerAddress }),
    ).rejects.toThrow(/`client` is not defined/)
  })

  it('rejects an invalid `asset`', async function () {
    await expect(
      getAssetData(client, { asset: '0xnope', routerAddress }),
    ).rejects.toThrow(/`asset` is not a valid address/)
  })

  it('rejects an invalid `routerAddress`', async function () {
    await expect(
      getAssetData(client, { asset, routerAddress: '0xnope' as Address }),
    ).rejects.toThrow(/`routerAddress` is not a valid address/)
  })
})
