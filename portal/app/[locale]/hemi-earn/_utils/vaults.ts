import { hemiEarnVaults } from '@vetro-protocol/earn/hemiEarn'
import { type Address, isAddressEqual } from 'viem'

import { type EarnVault } from '../types'

export const findVaultByAsset = (vaults: EarnVault[], asset: Address) =>
  vaults.find(vault => vault.assets.some(a => isAddressEqual(a.address, asset)))

export const findVaultByShare = (vaults: EarnVault[], shareAddress: Address) =>
  vaults.find(vault => isAddressEqual(vault.shareAddress, shareAddress))

export const findVaultMetadata = (stakingVault: Address) =>
  hemiEarnVaults.find(vault => isAddressEqual(vault.address, stakingVault))
