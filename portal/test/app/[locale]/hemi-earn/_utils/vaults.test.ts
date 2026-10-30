import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  findVaultByAsset,
  findVaultByShare,
} from '../../../../../app/[locale]/hemi-earn/_utils/vaults'
import { type EarnVault } from '../../../../../app/[locale]/hemi-earn/types'

describe('vaults', function () {
  describe('findVaultByAsset / findVaultByShare', function () {
    const shareA = '0x000000000000000000000000000000000000aaaa' as Address
    const shareB = '0x000000000000000000000000000000000000bbbb' as Address
    const assetA1 = '0x0000000000000000000000000000000000001111' as Address
    const assetA2 = '0x0000000000000000000000000000000000002222' as Address
    const assetB1 = '0x0000000000000000000000000000000000003333' as Address
    const unknown = '0x0000000000000000000000000000000000009999' as Address

    const makeVault = (shareAddress: Address, assets: Address[]) =>
      ({
        assets: assets.map(address => ({ address })),
        shareAddress,
      }) as unknown as EarnVault

    const vaults: EarnVault[] = [
      makeVault(shareA, [assetA1, assetA2]),
      makeVault(shareB, [assetB1]),
    ]

    it('findVaultByAsset finds the vault whose `assets` includes the address', function () {
      expect(findVaultByAsset(vaults, assetA2)?.shareAddress).toBe(shareA)
      expect(findVaultByAsset(vaults, assetB1)?.shareAddress).toBe(shareB)
    })

    it('findVaultByAsset returns undefined for an unknown asset', function () {
      expect(findVaultByAsset(vaults, unknown)).toBeUndefined()
    })

    it('findVaultByShare finds the vault by share address', function () {
      expect(findVaultByShare(vaults, shareB)?.shareAddress).toBe(shareB)
    })

    it('findVaultByShare returns undefined for an unknown share', function () {
      expect(findVaultByShare(vaults, unknown)).toBeUndefined()
    })
  })
})
