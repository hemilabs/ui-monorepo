import {
  type Address,
  type BlockNumber,
  type BlockTag,
  type Client,
  zeroAddress,
} from 'viem'
import { getContractEvents } from 'viem/actions'

import { routerAbi } from '../../abi'
import { getHemiEarnRouterAddress } from '../../constants'

export type RegistryEntry = {
  asset: Address
  share: Address
  remoteAsset: Address
}

// Reads the asset → share registry from the Router's `AssetDataUpdated`
// events. The registry isn't exposed as a single view function on-chain
// (`assetsData(asset)` only resolves one entry at a time), but every
// registration / update emits this event, so the log history is the
// authoritative source.
//
// Multiple events for the same asset are deduped — the last entry wins,
// mirroring how `updateAssetData` overwrites the storage slot. Entries with a
// zero `share` are filtered out (the Router rejects them at write-time, but
// older deployments or recoverable misconfigurations could leak through).
export const getAssetRegistry = async function ({
  client,
  fromBlock = BigInt(0),
  routerAddress = getHemiEarnRouterAddress(),
  toBlock = 'latest',
}: {
  client: Client
  fromBlock?: BlockNumber
  routerAddress?: Address
  toBlock?: BlockNumber | BlockTag
}): Promise<RegistryEntry[]> {
  const logs = await getContractEvents(client, {
    abi: routerAbi,
    address: routerAddress,
    eventName: 'AssetDataUpdated',
    fromBlock,
    toBlock,
  })

  const latest = new Map<Address, RegistryEntry>()
  for (const log of logs) {
    const { asset, remoteAsset, share } = log.args
    if (!asset || !share || share === zeroAddress) continue
    latest.set(asset, { asset, remoteAsset: remoteAsset ?? zeroAddress, share })
  }
  return Array.from(latest.values())
}
