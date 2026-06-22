import { type Address, zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  canRetryRow,
  findPoolByAsset,
  findPoolByShare,
  formatApyDisplay,
  getTerminalDeliveryTxHash,
  hasFailedSettlement,
  hashesMatch,
  isEarnRowInFlight,
  isLocalEarnTransactionRow,
  isRecoverPath,
  needsManualClaim,
  needsRecover,
} from '../../../../../app/[locale]/hemi-earn/_utils'
import {
  type EarnPool,
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../../../app/[locale]/hemi-earn/types'

const baseTx: EarnTransaction = {
  amountIn: '1000000000000000000',
  amountOut: null,
  asset: zeroAddress,
  automatic: true,
  claimTxHash: null,
  kind: 'DEPOSIT',
  receiver: zeroAddress,
  recoverTxHash: null,
  requestedAt: '0',
  requestId: '0',
  requestTxHash: `0x${'1'.repeat(64)}`,
  status: 'PENDING',
}

const claimHash = `0x${'a'.repeat(64)}` as const
const recoverHash = `0x${'b'.repeat(64)}` as const

describe('utils', function () {
  describe('formatApyDisplay', function () {
    it('should return "< 0.01%" for tiny positive values', function () {
      expect(formatApyDisplay(0.005)).toBe('< 0.01%')
    })

    it('should return "< -0.01%" for tiny negative values', function () {
      expect(formatApyDisplay(-0.005)).toBe('< -0.01%')
    })

    it('should return "0.00%" for zero', function () {
      expect(formatApyDisplay(0)).toBe('0.00%')
    })

    it('should format percentage for negative values beyond the threshold', function () {
      expect(formatApyDisplay(-5.25)).toBe('-5.25%')
    })

    it('should format percentage for value equal to 0.01', function () {
      expect(formatApyDisplay(0.01)).toBe('0.01%')
    })

    it('should format percentage for larger values', function () {
      expect(formatApyDisplay(5.25)).toBe('5.25%')
    })
  })

  describe('getTerminalDeliveryTxHash', function () {
    it('returns claimTxHash for FINALIZED', function () {
      expect(
        getTerminalDeliveryTxHash({
          ...baseTx,
          claimTxHash: claimHash,
          status: 'FINALIZED',
        }),
      ).toBe(claimHash)
    })

    it('returns recoverTxHash for RECOVERED', function () {
      expect(
        getTerminalDeliveryTxHash({
          ...baseTx,
          recoverTxHash: recoverHash,
          status: 'RECOVERED',
        }),
      ).toBe(recoverHash)
    })

    it.each<EarnTransactionStatusType>([
      'PENDING',
      'FULFILLED',
      'CANCELLED',
      'TX_PENDING',
      'FAILED',
    ])('returns undefined for non-terminal status %s', function (status) {
      expect(
        getTerminalDeliveryTxHash({
          ...baseTx,
          claimTxHash: claimHash,
          recoverTxHash: recoverHash,
          status,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when FINALIZED but claimTxHash is null', function () {
      expect(
        getTerminalDeliveryTxHash({
          ...baseTx,
          claimTxHash: null,
          status: 'FINALIZED',
        }),
      ).toBeUndefined()
    })

    it('returns undefined when RECOVERED but recoverTxHash is null', function () {
      expect(
        getTerminalDeliveryTxHash({
          ...baseTx,
          recoverTxHash: null,
          status: 'RECOVERED',
        }),
      ).toBeUndefined()
    })

    it('returns undefined when tx is undefined', function () {
      expect(getTerminalDeliveryTxHash(undefined)).toBeUndefined()
    })
  })

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

  describe('isLocalEarnTransactionRow', function () {
    it('returns true for a row whose `requestId` is locally-prefixed', function () {
      expect(
        isLocalEarnTransactionRow({ ...baseTx, requestId: 'local-1700000000' }),
      ).toBe(true)
    })

    it('returns false for a row whose `requestId` is a subgraph numeric id', function () {
      expect(isLocalEarnTransactionRow({ ...baseTx, requestId: '42' })).toBe(
        false,
      )
    })
  })

  describe('needsManualClaim', function () {
    it('is true for a FULFILLED deposit with auto-claim off', function () {
      expect(
        needsManualClaim({
          ...baseTx,
          automatic: false,
          kind: 'DEPOSIT',
          status: 'FULFILLED',
        }),
      ).toBe(true)
    })

    it('is false when auto-claim is on', function () {
      expect(
        needsManualClaim({ ...baseTx, automatic: true, status: 'FULFILLED' }),
      ).toBe(false)
    })

    it.each<EarnTransactionStatusType>(['PENDING', 'CANCELLED', 'FINALIZED'])(
      'is false for non-FULFILLED status %s',
      function (status) {
        expect(needsManualClaim({ ...baseTx, automatic: false, status })).toBe(
          false,
        )
      },
    )

    it('is false for a REDEEM row', function () {
      expect(
        needsManualClaim({
          ...baseTx,
          automatic: false,
          kind: 'REDEEM',
          status: 'FULFILLED',
        }),
      ).toBe(false)
    })
  })

  describe('needsRecover', function () {
    it('is true for a CANCELLED deposit with auto-recover off', function () {
      expect(
        needsRecover({
          ...baseTx,
          automatic: false,
          kind: 'DEPOSIT',
          status: 'CANCELLED',
        }),
      ).toBe(true)
    })

    it('is false when auto-recover is on', function () {
      expect(
        needsRecover({ ...baseTx, automatic: true, status: 'CANCELLED' }),
      ).toBe(false)
    })

    it('is false for RECOVERED (already recovered, not actionable)', function () {
      expect(
        needsRecover({ ...baseTx, automatic: false, status: 'RECOVERED' }),
      ).toBe(false)
    })

    it('is false for a REDEEM row', function () {
      expect(
        needsRecover({
          ...baseTx,
          automatic: false,
          kind: 'REDEEM',
          status: 'CANCELLED',
        }),
      ).toBe(false)
    })
  })

  describe('isRecoverPath', function () {
    it.each<EarnTransactionStatusType>(['CANCELLED', 'RECOVERED'])(
      'is true for a deposit in status %s regardless of automatic',
      function (status) {
        expect(isRecoverPath({ ...baseTx, automatic: true, status })).toBe(true)
        expect(isRecoverPath({ ...baseTx, automatic: false, status })).toBe(
          true,
        )
      },
    )

    it.each<EarnTransactionStatusType>(['PENDING', 'FULFILLED', 'FINALIZED'])(
      'is false for the happy-path status %s',
      function (status) {
        expect(isRecoverPath({ ...baseTx, status })).toBe(false)
      },
    )

    it('is false for a REDEEM row', function () {
      expect(
        isRecoverPath({ ...baseTx, kind: 'REDEEM', status: 'CANCELLED' }),
      ).toBe(false)
    })
  })

  describe('canRetryRow', function () {
    it('is true for a local FAILED row', function () {
      expect(
        canRetryRow({
          ...baseTx,
          requestId: 'local-1700000000',
          status: 'FAILED',
        }),
      ).toBe(true)
    })

    it('is false for a subgraph FAILED row (numeric requestId)', function () {
      expect(
        canRetryRow({ ...baseTx, requestId: '42', status: 'FAILED' }),
      ).toBe(false)
    })

    it('is false for a non-FAILED local row', function () {
      expect(
        canRetryRow({
          ...baseTx,
          requestId: 'local-1700000000',
          status: 'PENDING',
        }),
      ).toBe(false)
    })
  })

  describe('hasFailedSettlement', function () {
    it('is true when the settlement is flagged failed', function () {
      expect(
        hasFailedSettlement({
          ...baseTx,
          settlement: { failed: true, kind: 'CLAIM' },
        }),
      ).toBe(true)
    })

    it('is false for a pending (not-yet-failed) settlement', function () {
      expect(
        hasFailedSettlement({
          ...baseTx,
          settlement: { failed: false, kind: 'RECOVER', txHash: recoverHash },
        }),
      ).toBe(false)
    })

    it('is false when there is no settlement', function () {
      expect(hasFailedSettlement(baseTx)).toBe(false)
    })
  })

  describe('isEarnRowInFlight', function () {
    it.each<EarnTransactionStatusType>(['PENDING', 'FULFILLED', 'TX_PENDING'])(
      'is true for the non-terminal status %s',
      function (status) {
        expect(isEarnRowInFlight({ ...baseTx, status })).toBe(true)
      },
    )

    it.each<EarnTransactionStatusType>(['FINALIZED', 'RECOVERED', 'FAILED'])(
      'is false for the terminal status %s',
      function (status) {
        expect(isEarnRowInFlight({ ...baseTx, status })).toBe(false)
      },
    )

    it.each([true, false])(
      'is true for a CANCELLED deposit (automatic=%s — both walk to RECOVERED)',
      function (automatic) {
        expect(
          isEarnRowInFlight({ ...baseTx, automatic, status: 'CANCELLED' }),
        ).toBe(true)
      },
    )

    it('is false for a CANCELLED redeem (withdrawal canceled, terminal)', function () {
      expect(
        isEarnRowInFlight({ ...baseTx, kind: 'REDEEM', status: 'CANCELLED' }),
      ).toBe(false)
    })
  })

  describe('hashesMatch', function () {
    const lower = `0x${'a'.repeat(64)}` as const
    const upper = `0x${'A'.repeat(64)}` as const
    const other = `0x${'b'.repeat(64)}` as const

    it('matches identical hashes', function () {
      expect(hashesMatch(lower, lower)).toBe(true)
    })

    it('matches case-insensitively', function () {
      expect(hashesMatch(lower, upper)).toBe(true)
    })

    it('does not match different hashes', function () {
      expect(hashesMatch(lower, other)).toBe(false)
    })

    it('returns false when the first hash is undefined', function () {
      expect(hashesMatch(undefined, lower)).toBe(false)
    })

    it('returns false when the second hash is undefined', function () {
      expect(hashesMatch(lower, undefined)).toBe(false)
    })

    it('returns false when both are undefined', function () {
      expect(hashesMatch(undefined, undefined)).toBe(false)
    })
  })
})
