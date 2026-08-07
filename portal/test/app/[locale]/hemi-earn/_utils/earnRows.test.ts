import { type EvmToken } from 'types/token'
import { type Address } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  hasInFlightEarnActions,
  inTransitOnlyPositions,
  pickEarnRowAmount,
  sumInTransitSharesByShare,
} from '../../../../../app/[locale]/hemi-earn/_utils/earnRows'
import {
  type EarnPool,
  type EarnPosition,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../../../../../app/[locale]/hemi-earn/types'

import { baseTx } from './fixtures'

describe('earnRows', function () {
  describe('hasInFlightEarnActions', function () {
    const localOp = (initiateTxHash: string | undefined, settled: boolean) =>
      ({ initiateTxHash, settled }) as unknown as LocalEarnOperation

    it('is false when there are no local ops and no transactions', function () {
      expect(
        hasInFlightEarnActions({ localOperations: [], transactions: [] }),
      ).toBe(false)
    })

    it('is true when a local op is initiated but not settled yet', function () {
      expect(
        hasInFlightEarnActions({
          localOperations: [localOp(`0x${'9'.repeat(64)}`, false)],
          transactions: [],
        }),
      ).toBe(true)
    })

    it('is false when the only local op is already settled', function () {
      expect(
        hasInFlightEarnActions({
          localOperations: [localOp(`0x${'9'.repeat(64)}`, true)],
          transactions: [],
        }),
      ).toBe(false)
    })

    it('is false when a local op has no initiate tx hash', function () {
      expect(
        hasInFlightEarnActions({
          localOperations: [localOp(undefined, false)],
          transactions: [],
        }),
      ).toBe(false)
    })

    it('is true when a subgraph transaction is still in flight', function () {
      expect(
        hasInFlightEarnActions({
          localOperations: [],
          transactions: [{ ...baseTx, status: 'PENDING' }],
        }),
      ).toBe(true)
    })

    it('is false when every transaction has reached a terminal status', function () {
      expect(
        hasInFlightEarnActions({
          localOperations: [],
          transactions: [{ ...baseTx, status: 'FINALIZED' }],
        }),
      ).toBe(false)
    })
  })

  describe('inTransitOnlyPositions', function () {
    const shareA = '0x00000000000000000000000000000000000000e1' as Address
    const shareB = '0x00000000000000000000000000000000000000e2' as Address
    const peggedToken = { decimals: 18 } as unknown as EvmToken
    const shareToken = { symbol: 'S' } as unknown as EvmToken
    const makePool = (shareAddress: Address) =>
      ({
        assets: [],
        peggedToken,
        shareAddress,
        shareToken,
      }) as unknown as EarnPool
    const pools = [makePool(shareA), makePool(shareB)]

    it('synthesizes a zero-balance row for an in-transit share with no position', function () {
      expect(
        inTransitOnlyPositions(
          { [shareA.toLowerCase()]: BigInt(5) },
          [],
          pools,
        ),
      ).toEqual([
        {
          peggedToken,
          shareAddress: shareA,
          shareToken,
          yourDeposit: BigInt(0),
        },
      ])
    })

    it('skips a share already covered by a position', function () {
      const position = {
        peggedToken,
        shareAddress: shareA,
        shareToken,
        yourDeposit: BigInt(100),
      } as unknown as EarnPosition
      expect(
        inTransitOnlyPositions(
          { [shareA.toLowerCase()]: BigInt(5) },
          [position],
          pools,
        ),
      ).toEqual([])
    })

    it('drops an in-transit share that maps to no pool', function () {
      expect(
        inTransitOnlyPositions(
          { [`0x${'f'.repeat(40)}`]: BigInt(5) },
          [],
          pools,
        ),
      ).toEqual([])
    })
  })

  describe('pickEarnRowAmount', function () {
    const assetToken = { decimals: 8, symbol: 'hemiBTC' } as unknown as EvmToken
    const shareToken = {
      decimals: 18,
      symbol: 'svetBTC',
    } as unknown as EvmToken
    const tokens = { assetToken, shareToken }

    it('uses amountIn + assetToken for a DEPOSIT even once amountOut (shares) is set', function () {
      // Regression: a finalized deposit carries `amountOut` = minted shares
      // (18-dec). Rendering it against the 8-dec asset token showed 1,000,000
      // instead of the deposited 0.0001.
      expect(
        pickEarnRowAmount(
          {
            ...baseTx,
            amountIn: '10000',
            amountOut: '100000000000000',
            kind: 'DEPOSIT',
            status: 'FINALIZED',
          },
          tokens,
        ),
      ).toEqual({ rawAmount: '10000', token: assetToken })
    })

    it('uses amountIn + assetToken for a DEPOSIT with no amountOut yet', function () {
      expect(
        pickEarnRowAmount(
          { ...baseTx, amountIn: '10000', amountOut: null, kind: 'DEPOSIT' },
          tokens,
        ),
      ).toEqual({ rawAmount: '10000', token: assetToken })
    })

    it('uses amountIn + shareToken for a REDEEM before it is fulfilled', function () {
      expect(
        pickEarnRowAmount(
          { ...baseTx, amountIn: '5000', amountOut: null, kind: 'REDEEM' },
          tokens,
        ),
      ).toEqual({ rawAmount: '5000', token: shareToken })
    })

    it('uses amountOut + assetToken for a REDEEM once fulfilled', function () {
      expect(
        pickEarnRowAmount(
          { ...baseTx, amountIn: '5000', amountOut: '7777', kind: 'REDEEM' },
          tokens,
        ),
      ).toEqual({ rawAmount: '7777', token: assetToken })
    })

    it('returns an undefined token for an in-flight REDEEM while the share token is still loading', function () {
      expect(
        pickEarnRowAmount(
          { ...baseTx, amountIn: '5000', amountOut: null, kind: 'REDEEM' },
          { assetToken },
        ),
      ).toEqual({ rawAmount: '5000', token: undefined })
    })
  })

  describe('sumInTransitSharesByShare', function () {
    const redeemAsset = '0x00000000000000000000000000000000000000c1' as Address
    const share = '0x00000000000000000000000000000000000000d2' as Address
    const makePool = (shareAddress: Address, assets: Address[]) =>
      ({
        assets: assets.map(address => ({ address })),
        shareAddress,
      }) as unknown as EarnPool
    const pools = [makePool(share, [redeemAsset])]
    const redeem = (
      overrides: Partial<EarnTransaction> = {},
    ): EarnTransaction => ({
      ...baseTx,
      amountIn: '2000000000000000000',
      amountOut: null,
      asset: redeemAsset,
      kind: 'REDEEM',
      status: 'PENDING',
      ...overrides,
    })

    it('sums the amountIn of an in-flight redeem under its share', function () {
      expect(sumInTransitSharesByShare([redeem()], pools)).toEqual({
        [share.toLowerCase()]: BigInt('2000000000000000000'),
      })
    })

    it('counts a CANCELLED redeem (shares still out, pre-recover)', function () {
      expect(
        sumInTransitSharesByShare([redeem({ status: 'CANCELLED' })], pools),
      ).toEqual({ [share.toLowerCase()]: BigInt('2000000000000000000') })
    })

    it('excludes terminal redeems (RECOVERED / FINALIZED)', function () {
      expect(
        sumInTransitSharesByShare(
          [redeem({ status: 'RECOVERED' }), redeem({ status: 'FINALIZED' })],
          pools,
        ),
      ).toEqual({})
    })

    it('excludes a FULFILLED redeem whose amountOut has landed', function () {
      expect(
        sumInTransitSharesByShare(
          [redeem({ amountOut: '1900000', status: 'FULFILLED' })],
          pools,
        ),
      ).toEqual({})
    })

    it('excludes a TX_PENDING redeem (request tx not mined, shares still held)', function () {
      expect(
        sumInTransitSharesByShare([redeem({ status: 'TX_PENDING' })], pools),
      ).toEqual({})
    })

    it('excludes deposits', function () {
      expect(
        sumInTransitSharesByShare([redeem({ kind: 'DEPOSIT' })], pools),
      ).toEqual({})
    })

    it('sums multiple in-flight redeems for the same share', function () {
      expect(
        sumInTransitSharesByShare(
          [
            redeem({ amountIn: '2000000000000000000' }),
            redeem({ amountIn: '1500000000000000000', requestId: '1' }),
          ],
          pools,
        ),
      ).toEqual({ [share.toLowerCase()]: BigInt('3500000000000000000') })
    })

    it('ignores a redeem whose asset maps to no pool', function () {
      expect(
        sumInTransitSharesByShare(
          [redeem({ asset: `0x${'e'.repeat(40)}` })],
          pools,
        ),
      ).toEqual({})
    })
  })
})
