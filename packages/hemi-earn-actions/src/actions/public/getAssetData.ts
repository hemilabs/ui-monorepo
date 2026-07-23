import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { readContract } from 'viem/actions'

import { getHemiEarnRouterAddress } from '../../constants.ts'
import { routerAbi } from '../../routerAbi.ts'

export type AssetData = {
  enabled: boolean
  // Ethereum-side counterpart the Agent uses on the fulfillment leg.
  remoteAsset: Address
  // Ethereum staking vault (sVetToken), despite the name — carried in the deposit compose message.
  remoteShare: Address
  share: Address
}

export const getAssetData = async function (
  client: Client,
  {
    asset,
    routerAddress = getHemiEarnRouterAddress(),
  }: {
    asset: Address
    routerAddress?: Address
  },
): Promise<AssetData> {
  if (!client) {
    throw new Error('getAssetData: `client` is not defined')
  }
  if (!isAddress(asset, { strict: false })) {
    throw new Error('getAssetData: `asset` is not a valid address')
  }
  if (!isAddress(routerAddress, { strict: false })) {
    throw new Error('getAssetData: `routerAddress` is not a valid address')
  }
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
