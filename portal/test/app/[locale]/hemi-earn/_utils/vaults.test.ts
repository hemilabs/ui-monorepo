import { hemiEarnVaults } from '@vetro-protocol/hemi-earn'
import { type Address, getAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  canAccessVault,
  findVaultByAsset,
  findVaultByShare,
  findVaultMetadata,
  getListedVaults,
  getVaultDetails,
} from '../../../../../app/[locale]/hemi-earn/_utils/vaults'
import { type EarnVault } from '../../../../../app/[locale]/hemi-earn/types'

import { baseTx } from './fixtures'

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

  describe('getListedVaults', function () {
    const delisted = {
      shareAddress: '0x000000000000000000000000000000000000dddd',
      stakingVault: '0x0000000000000000000000000000000000009999',
    } as EarnVault
    const listed = hemiEarnVaults.map(
      ({ address }, index) =>
        ({
          shareAddress: `0x${String(index + 1).padStart(40, '0')}`,
          stakingVault: address,
        }) as EarnVault,
    )

    it('keeps only listed vaults, in hemiEarnVaults order', function () {
      const result = getListedVaults([delisted, ...[...listed].reverse()])
      expect(result.map(vault => vault.stakingVault)).toEqual(
        hemiEarnVaults.map(vault => vault.address),
      )
    })

    it('returns an empty list when no vault is listed', function () {
      expect(getListedVaults([delisted])).toEqual([])
    })
  })

  describe('getVaultDetails', function () {
    const operator = 'Operator Corp.'

    it('joins curators with a comma and counts them', function () {
      expect(getVaultDetails({ curators: ['A', 'B', 'C'], operator })).toEqual({
        curators: { count: 3, names: 'A, B, C' },
        operator,
      })
    })

    it('counts a single curator', function () {
      expect(getVaultDetails({ curators: ['A'], operator })).toEqual({
        curators: { count: 1, names: 'A' },
        operator,
      })
    })

    it('omits curators when they are not set', function () {
      expect(getVaultDetails({ operator })).toEqual({
        curators: undefined,
        operator,
      })
    })

    it('omits curators when the list is empty', function () {
      expect(getVaultDetails({ curators: [], operator })).toEqual({
        curators: undefined,
        operator,
      })
    })
  })

  describe('canAccessVault', function () {
    const shareAddress = '0x000000000000000000000000000000000000aaaa'
    const asset = '0x0000000000000000000000000000000000001111'
    const otherAsset = '0x0000000000000000000000000000000000002222'
    const nowSec = 1_000

    const makeVault = (isListed: boolean) =>
      ({
        assets: [{ address: asset }],
        isListed,
        shareAddress,
      }) as EarnVault

    const noActivity = {
      inTransitByShare: {},
      nowSec,
      positions: [],
      transactions: [],
    }

    it('allows a listed vault without any activity', function () {
      expect(canAccessVault({ ...noActivity, vault: makeVault(true) })).toBe(
        true,
      )
    })

    it('denies a delisted vault without any activity', function () {
      expect(canAccessVault({ ...noActivity, vault: makeVault(false) })).toBe(
        false,
      )
    })

    it('allows a delisted vault when the wallet holds its shares', function () {
      expect(
        canAccessVault({
          ...noActivity,
          positions: [{ shareAddress, yourDeposit: BigInt(1) }],
          vault: makeVault(false),
        }),
      ).toBe(true)
    })

    it('denies a delisted vault when the position is empty', function () {
      expect(
        canAccessVault({
          ...noActivity,
          positions: [{ shareAddress, yourDeposit: BigInt(0) }],
          vault: makeVault(false),
        }),
      ).toBe(false)
    })

    it('allows a delisted vault with shares in transit', function () {
      expect(
        canAccessVault({
          ...noActivity,
          inTransitByShare: { [getAddress(shareAddress)]: BigInt(1) },
          vault: makeVault(false),
        }),
      ).toBe(true)
    })

    it('allows a delisted vault with a withdrawal to claim', function () {
      expect(
        canAccessVault({
          ...noActivity,
          transactions: [
            { ...baseTx, asset, kind: 'REDEEM', status: 'FULFILLED' },
          ],
          vault: makeVault(false),
        }),
      ).toBe(true)
    })

    it('allows a delisted vault whose withdrawal cooldown has elapsed', function () {
      expect(
        canAccessVault({
          ...noActivity,
          transactions: [
            {
              ...baseTx,
              asset,
              claimableAt: String(nowSec),
              kind: 'REDEEM',
              status: 'PENDING',
            },
          ],
          vault: makeVault(false),
        }),
      ).toBe(true)
    })

    it('denies a delisted vault whose withdrawal cooldown is still running', function () {
      expect(
        canAccessVault({
          ...noActivity,
          transactions: [
            {
              ...baseTx,
              asset,
              claimableAt: String(nowSec + 1),
              kind: 'REDEEM',
              status: 'PENDING',
            },
          ],
          vault: makeVault(false),
        }),
      ).toBe(false)
    })

    it('ignores claimable withdrawals and deposits of other vaults', function () {
      expect(
        canAccessVault({
          ...noActivity,
          transactions: [
            {
              ...baseTx,
              asset: otherAsset,
              kind: 'REDEEM',
              status: 'FULFILLED',
            },
            { ...baseTx, asset, kind: 'DEPOSIT', status: 'FULFILLED' },
          ],
          vault: makeVault(false),
        }),
      ).toBe(false)
    })
  })
})
