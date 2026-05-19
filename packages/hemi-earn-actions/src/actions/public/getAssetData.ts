import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants'
import { routerAbi } from '../../routerAbi'

export type AssetData = {
  // Hemi-side share OFT this deposit asset settles into (e.g. svetBTC).
  share: Address
  // Ethereum-side asset address used by the Agent on the fulfillment leg —
  // the OFT's remote counterpart that the Vetro Gateway accepts as input.
  remoteAsset: Address
}

// Per-key lookup of the Router's asset registry: given a Hemi-side deposit
// asset (e.g. the hemiBTC OFT), returns the share OFT it settles into plus
// the Ethereum-side asset the Agent uses on fulfillment.
export const getAssetData = async function ({
  asset,
  client,
  routerAddress = getHemiEarnRouterAddress(),
}: {
  asset: Address
  client: Client
  routerAddress?: Address
}): Promise<AssetData> {
  if (isAddressEqual(asset, zeroAddress)) {
    throw new Error('getAssetData: `asset` cannot be the zero address')
  }

  return readContract(client, {
    abi: routerAbi,
    address: routerAddress,
    args: [asset],
    functionName: 'assetsData',
  })
}
