import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  findPoolByAsset,
  findPoolByShare,
} from '../../../../../app/[locale]/hemi-earn/_utils/pools'
import { type EarnPool } from '../../../../../app/[locale]/hemi-earn/types'

describe('pools', function () {
  describe('findPoolByAsset / findPoolByShare', function () {
    const shareA = '0x000000000000000000000000000000000000aaaa' as Address
    const shareB = '0x000000000000000000000000000000000000bbbb' as Address
    const assetA1 = '0x0000000000000000000000000000000000001111' as Address
    const assetA2 = '0x0000000000000000000000000000000000002222' as Address
    const assetB1 = '0x0000000000000000000000000000000000003333' as Address
    const unknown = '0x0000000000000000000000000000000000009999' as Address

    const makePool = (shareAddress: Address, assets: Address[]) =>
      ({
        assets: assets.map(address => ({ address })),
        shareAddress,
      }) as unknown as EarnPool

    const pools: EarnPool[] = [
      makePool(shareA, [assetA1, assetA2]),
      makePool(shareB, [assetB1]),
    ]

    it('findPoolByAsset finds the pool whose `assets` includes the address', function () {
      expect(findPoolByAsset(pools, assetA2)?.shareAddress).toBe(shareA)
      expect(findPoolByAsset(pools, assetB1)?.shareAddress).toBe(shareB)
    })

    it('findPoolByAsset returns undefined for an unknown asset', function () {
      expect(findPoolByAsset(pools, unknown)).toBeUndefined()
    })

    it('findPoolByShare finds the pool by share address', function () {
      expect(findPoolByShare(pools, shareB)?.shareAddress).toBe(shareB)
    })

    it('findPoolByShare returns undefined for an unknown share', function () {
      expect(findPoolByShare(pools, unknown)).toBeUndefined()
    })
  })
})
