import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type EvmToken } from 'types/token'
import { type Address, type Hash, zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  canRetryRow,
  enrichWithSettlement,
  findLocalSettlement,
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
  pickEarnRowAmount,
  pickSettleBannerKey,
  resolveSettleStepStatus,
} from '../../../../../app/[locale]/hemi-earn/_utils'
import {
  type EarnPool,
  type EarnSettlement,
  type EarnTransaction,
  type EarnTransactionStatusType,
  type LocalEarnOperation,
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

    it('is true even when auto-claim is on (auto-finalize reverted leaves it FULFILLED)', function () {
      expect(
        needsManualClaim({ ...baseTx, automatic: true, status: 'FULFILLED' }),
      ).toBe(true)
    })

    it.each<EarnTransactionStatusType>(['PENDING', 'CANCELLED', 'FINALIZED'])(
      'is false for non-FULFILLED status %s',
      function (status) {
        expect(needsManualClaim({ ...baseTx, automatic: false, status })).toBe(
          false,
        )
      },
    )

    it('is true for a FULFILLED redeem with auto-claim off (kind-agnostic)', function () {
      expect(
        needsManualClaim({
          ...baseTx,
          automatic: false,
          kind: 'REDEEM',
          status: 'FULFILLED',
        }),
      ).toBe(true)
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

    it('is true even when auto-recover is on (auto-finalize reverted leaves it CANCELLED)', function () {
      expect(
        needsRecover({ ...baseTx, automatic: true, status: 'CANCELLED' }),
      ).toBe(true)
    })

    it('is false for RECOVERED (already recovered, not actionable)', function () {
      expect(
        needsRecover({ ...baseTx, automatic: false, status: 'RECOVERED' }),
      ).toBe(false)
    })

    it('is true for a CANCELLED redeem with auto-recover off (kind-agnostic)', function () {
      expect(
        needsRecover({
          ...baseTx,
          automatic: false,
          kind: 'REDEEM',
          status: 'CANCELLED',
        }),
      ).toBe(true)
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

    it.each<EarnTransactionStatusType>(['CANCELLED', 'RECOVERED'])(
      'is true for a redeem in status %s (kind-agnostic)',
      function (status) {
        expect(isRecoverPath({ ...baseTx, kind: 'REDEEM', status })).toBe(true)
      },
    )
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

  describe('findLocalSettlement', function () {
    const reqHash = `0x${'b'.repeat(64)}` as Hash
    const settlement: EarnSettlement = {
      failed: false,
      kind: 'CLAIM',
      txHash: claimHash,
    }
    const makeLocalOp = (
      initiateTxHash: string | undefined,
      withSettlement?: EarnSettlement,
    ) =>
      ({
        initiateTxHash,
        settlement: withSettlement,
      }) as unknown as LocalEarnOperation

    it('returns the settlement of the op matching the request tx', function () {
      const ops = [
        makeLocalOp(`0x${'9'.repeat(64)}`),
        makeLocalOp(reqHash, settlement),
      ]
      expect(findLocalSettlement(ops, reqHash)).toBe(settlement)
    })

    it('matches the request tx case-insensitively', function () {
      const ops = [makeLocalOp(`0x${'B'.repeat(64)}`, settlement)]
      expect(findLocalSettlement(ops, reqHash)).toBe(settlement)
    })

    it('returns undefined when no op matches', function () {
      expect(
        findLocalSettlement(
          [makeLocalOp(`0x${'9'.repeat(64)}`, settlement)],
          reqHash,
        ),
      ).toBeUndefined()
    })

    it('returns undefined when requestTxHash is undefined', function () {
      expect(
        findLocalSettlement([makeLocalOp(reqHash, settlement)], undefined),
      ).toBeUndefined()
    })

    it('skips ops without an initiateTxHash', function () {
      expect(
        findLocalSettlement([makeLocalOp(undefined, settlement)], reqHash),
      ).toBeUndefined()
    })

    it('returns undefined when the matching op has no settlement', function () {
      expect(
        findLocalSettlement([makeLocalOp(reqHash)], reqHash),
      ).toBeUndefined()
    })
  })

  describe('enrichWithSettlement', function () {
    const settlement: EarnSettlement = { failed: true, kind: 'RECOVER' }

    it('folds the settlement onto the row', function () {
      expect(enrichWithSettlement(baseTx, settlement)).toEqual({
        ...baseTx,
        settlement,
      })
    })

    it('returns the row unchanged when there is no settlement', function () {
      expect(enrichWithSettlement(baseTx, undefined)).toBe(baseTx)
    })

    it('returns undefined when the row is undefined', function () {
      expect(enrichWithSettlement(undefined, settlement)).toBeUndefined()
    })
  })

  describe('isEarnRowInFlight', function () {
    it.each<EarnTransactionStatusType>(['PENDING', 'FULFILLED', 'TX_PENDING'])(
      'is true for the non-terminal status %s',
      function (status) {
        expect(isEarnRowInFlight({ ...baseTx, status })).toBe(true)
      },
    )

    it.each<EarnTransactionStatusType>(['FINALIZED', 'RECOVERED'])(
      'is false for the terminal status %s',
      function (status) {
        expect(isEarnRowInFlight({ ...baseTx, status })).toBe(false)
      },
    )

    it('is true for a subgraph FAILED row (Agent failed cross-chain; walks to RECOVERED)', function () {
      expect(
        isEarnRowInFlight({ ...baseTx, requestId: '40', status: 'FAILED' }),
      ).toBe(true)
    })

    it('is false for a local FAILED row (Hemi request tx reverted; terminal, retry from home)', function () {
      expect(
        isEarnRowInFlight({
          ...baseTx,
          requestId: 'local-1700000000',
          status: 'FAILED',
        }),
      ).toBe(false)
    })

    it.each([true, false])(
      'is true for a CANCELLED deposit (automatic=%s — both walk to RECOVERED)',
      function (automatic) {
        expect(
          isEarnRowInFlight({ ...baseTx, automatic, status: 'CANCELLED' }),
        ).toBe(true)
      },
    )

    it.each([true, false])(
      'is true for a CANCELLED redeem (automatic=%s — now walks to RECOVERED)',
      function (automatic) {
        expect(
          isEarnRowInFlight({
            ...baseTx,
            automatic,
            kind: 'REDEEM',
            status: 'CANCELLED',
          }),
        ).toBe(true)
      },
    )
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

  describe('resolveSettleStepStatus', function () {
    const base = {
      awaitingAction: false,
      fallback: ProgressStatus.NOT_READY,
      isComplete: false,
      settlementFailed: false,
      settlementTxHash: undefined,
    }
    const someHash = `0x${'c'.repeat(64)}` as const

    it('is COMPLETED when complete, over a failed/mining/awaiting settlement', function () {
      expect(
        resolveSettleStepStatus({
          ...base,
          awaitingAction: true,
          isComplete: true,
          settlementFailed: true,
          settlementTxHash: someHash,
        }),
      ).toBe(ProgressStatus.COMPLETED)
    })

    it('is FAILED when the settlement reverted and is not complete', function () {
      expect(
        resolveSettleStepStatus({
          ...base,
          awaitingAction: true,
          settlementFailed: true,
          settlementTxHash: someHash,
        }),
      ).toBe(ProgressStatus.FAILED)
    })

    it('is PROGRESS while the settlement is mining', function () {
      expect(
        resolveSettleStepStatus({
          ...base,
          awaitingAction: true,
          settlementTxHash: someHash,
        }),
      ).toBe(ProgressStatus.PROGRESS)
    })

    it('is READY for an untouched manual settlement', function () {
      expect(resolveSettleStepStatus({ ...base, awaitingAction: true })).toBe(
        ProgressStatus.READY,
      )
    })

    it('falls back to the caller-provided in-flight status otherwise', function () {
      expect(
        resolveSettleStepStatus({ ...base, fallback: ProgressStatus.PROGRESS }),
      ).toBe(ProgressStatus.PROGRESS)
      expect(resolveSettleStepStatus(base)).toBe(ProgressStatus.NOT_READY)
    })
  })

  describe('pickSettleBannerKey', function () {
    it.each<[EarnTransaction['kind'], EarnTransactionStatusType, string]>([
      ['DEPOSIT', 'FULFILLED', 'claim-shares'],
      ['REDEEM', 'FULFILLED', 'claim-funds'],
      ['DEPOSIT', 'CANCELLED', 'recover-funds'],
      ['REDEEM', 'CANCELLED', 'recover-shares'],
    ])('%s %s → %s', function (kind, status, expected) {
      expect(pickSettleBannerKey({ ...baseTx, kind, status })).toBe(expected)
    })

    it.each<EarnTransactionStatusType>([
      'PENDING',
      'TX_PENDING',
      'FINALIZED',
      'RECOVERED',
      'FAILED',
    ])('returns undefined for the non-actionable status %s', function (status) {
      expect(pickSettleBannerKey({ ...baseTx, status })).toBeUndefined()
    })

    it('returns undefined for an undefined row', function () {
      expect(pickSettleBannerKey(undefined)).toBeUndefined()
    })
  })
})
