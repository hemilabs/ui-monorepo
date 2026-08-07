import { type Address, isAddressEqual } from 'viem'

import { type EarnPool } from '../types'

export const findPoolByAsset = (pools: EarnPool[], asset: Address) =>
  pools.find(p => p.assets.some(a => isAddressEqual(a.address, asset)))

export const findPoolByShare = (pools: EarnPool[], shareAddress: Address) =>
  pools.find(p => isAddressEqual(p.shareAddress, shareAddress))
