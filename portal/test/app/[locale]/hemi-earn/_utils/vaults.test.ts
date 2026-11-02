import { hemiEarnVaults } from '@vetro-protocol/earn/hemiEarn'
import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  findVaultByAsset,
  findVaultByShare,
  findVaultMetadata,
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

  describe('findVaultMetadata', function () {
    it('returns the entry whose address was asked for, not just any entry', function () {
      // A `find` that ignored its predicate would still satisfy a per-element equality check.
      const found = hemiEarnVaults.map(vault =>
        findVaultMetadata(vault.address),
      )
      expect(found.map(vault => vault?.address)).toEqual(
        hemiEarnVaults.map(vault => vault.address),
      )
      expect(new Set(found).size).toBe(hemiEarnVaults.length)
    })

    it('exposes the operator and transfer time the drawer copy needs', function () {
      const [{ address, operator, typicalTransferTime }] = hemiEarnVaults
      expect(findVaultMetadata(address)).toMatchObject({
        operator,
        typicalTransferTime,
      })
    })

    it('matches regardless of address casing', function () {
      const [{ address }] = hemiEarnVaults
      expect(findVaultMetadata(address.toLowerCase() as Address)?.address).toBe(
        address,
      )
    })

    it('returns undefined for an address that is not a staking vault', function () {
      expect(
        findVaultMetadata('0x0000000000000000000000000000000000009999'),
      ).toBeUndefined()
    })
  })
})
