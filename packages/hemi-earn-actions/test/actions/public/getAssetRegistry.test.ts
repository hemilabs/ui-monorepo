import { type Address, type Client, zeroAddress } from 'viem'
import { getContractEvents } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getAssetRegistry } from '../../../src/actions/public/getAssetRegistry'

vi.mock('viem/actions', () => ({
  getContractEvents: vi.fn(),
}))

const client = {} as Client
const routerAddress = '0x000000000000000000000000000000000000bEEf' as Address
const assetA = '0x000000000000000000000000000000000000A1A1' as Address
const assetB = '0x000000000000000000000000000000000000B2B2' as Address
const shareX = '0x000000000000000000000000000000000000C3C3' as Address
const shareY = '0x000000000000000000000000000000000000D4D4' as Address
const remoteA = '0x000000000000000000000000000000000000E5E5' as Address

const log = (args: { asset: Address; share: Address; remoteAsset: Address }) =>
  ({
    args,
  }) as unknown as Awaited<ReturnType<typeof getContractEvents>>[number]

describe('getAssetRegistry', function () {
  it('groups events into one entry per asset', async function () {
    vi.mocked(getContractEvents).mockResolvedValue([
      log({ asset: assetA, remoteAsset: remoteA, share: shareX }),
      log({ asset: assetB, remoteAsset: remoteA, share: shareX }),
    ])

    const result = await getAssetRegistry({ client, routerAddress })

    expect(result).toEqual([
      { asset: assetA, remoteAsset: remoteA, share: shareX },
      { asset: assetB, remoteAsset: remoteA, share: shareX },
    ])
  })

  it('keeps the most recent entry when an asset is updated', async function () {
    vi.mocked(getContractEvents).mockResolvedValue([
      log({ asset: assetA, remoteAsset: remoteA, share: shareX }),
      log({ asset: assetA, remoteAsset: remoteA, share: shareY }),
    ])

    const result = await getAssetRegistry({ client, routerAddress })

    expect(result).toEqual([
      { asset: assetA, remoteAsset: remoteA, share: shareY },
    ])
  })

  it('drops entries with a zero share address', async function () {
    vi.mocked(getContractEvents).mockResolvedValue([
      log({ asset: assetA, remoteAsset: remoteA, share: zeroAddress }),
      log({ asset: assetB, remoteAsset: remoteA, share: shareX }),
    ])

    const result = await getAssetRegistry({ client, routerAddress })

    expect(result).toEqual([
      { asset: assetB, remoteAsset: remoteA, share: shareX },
    ])
  })

  it('forwards block range and address to getContractEvents', async function () {
    vi.mocked(getContractEvents).mockResolvedValue([])

    await getAssetRegistry({
      client,
      fromBlock: BigInt(100),
      routerAddress,
      toBlock: BigInt(200),
    })

    expect(getContractEvents).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        address: routerAddress,
        eventName: 'AssetDataUpdated',
        fromBlock: BigInt(100),
        toBlock: BigInt(200),
      }),
    )
  })
})
