import { describe, expect, it } from 'vitest'

import {
  canRetryRow,
  hasFailedSettlement,
  isAwaitingFinalize,
  isCooldownMature,
  isDeliberateCancel,
  isEarnRowInFlight,
  isEarnRowTerminal,
  isFinalizeInFlight,
  isLocalEarnTransactionRow,
  isRecoverPath,
  isRemoteFailed,
  isRemoteFailedCancel,
  isUserCancel,
  needsManualClaim,
  needsRecover,
  shouldShowRemoteFailedCtas,
} from '../../../../../app/[locale]/hemi-earn/_utils/transactionPredicates'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../../../app/[locale]/hemi-earn/types'

import { baseTx, recoverHash } from './fixtures'

describe('transactionPredicates', function () {
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

    it('is false for a reverted CANCEL (the modal owns that retry)', function () {
      expect(
        hasFailedSettlement({
          ...baseTx,
          settlement: { failed: true, kind: 'CANCEL' },
        }),
      ).toBe(false)
    })
  })

  describe('isAwaitingFinalize', function () {
    const awaiting: EarnTransaction = {
      ...baseTx,
      claimableAt: '1700000000',
      kind: 'REDEEM',
      status: 'PENDING',
    }

    it('is true for a PENDING cooldown redeem not yet finalized', function () {
      expect(isAwaitingFinalize(awaiting)).toBe(true)
    })

    it('is false once the Agent processed it (bridging back)', function () {
      expect(
        isAwaitingFinalize({ ...awaiting, processedAt: '1700000100' }),
      ).toBe(false)
    })

    it('is false while the user is cancelling', function () {
      expect(
        isAwaitingFinalize({ ...awaiting, cancellationRequested: true }),
      ).toBe(false)
    })

    it('is false for an instant redeem (no claimableAt)', function () {
      expect(isAwaitingFinalize({ ...awaiting, claimableAt: null })).toBe(false)
    })

    it('is false for a deposit', function () {
      expect(isAwaitingFinalize({ ...awaiting, kind: 'DEPOSIT' })).toBe(false)
    })
  })

  describe('isCooldownMature', function () {
    const matureRedeem: EarnTransaction = {
      ...baseTx,
      claimableAt: '1700000000',
      kind: 'REDEEM',
      status: 'PENDING',
    }

    it('is true for a PENDING cooldown redeem once remaining hits 0', function () {
      expect(isCooldownMature(matureRedeem, 0)).toBe(true)
    })

    it('is false while the cooldown is still counting down', function () {
      expect(isCooldownMature(matureRedeem, 120)).toBe(false)
    })

    it('is false when remaining is undefined (no claimableAt yet)', function () {
      expect(
        isCooldownMature({ ...matureRedeem, claimableAt: null }, undefined),
      ).toBe(false)
    })

    it('is false once the Agent processed it (return flight)', function () {
      expect(
        isCooldownMature({ ...matureRedeem, processedAt: '1700000100' }, 0),
      ).toBe(false)
    })

    it.each<EarnTransactionStatusType>(['FULFILLED', 'CANCELLED', 'FINALIZED'])(
      'is false for the non-PENDING status %s',
      function (status) {
        expect(isCooldownMature({ ...matureRedeem, status }, 0)).toBe(false)
      },
    )

    it('is false for a deposit', function () {
      expect(isCooldownMature({ ...matureRedeem, kind: 'DEPOSIT' }, 0)).toBe(
        false,
      )
    })

    it('is false while the user is cancelling (cancellationRequested)', function () {
      expect(
        isCooldownMature({ ...matureRedeem, cancellationRequested: true }, 0),
      ).toBe(false)
    })

    it('is false while a CANCEL marker is pending', function () {
      expect(
        isCooldownMature(
          { ...matureRedeem, settlement: { failed: false, kind: 'CANCEL' } },
          0,
        ),
      ).toBe(false)
    })
  })

  describe('isDeliberateCancel', function () {
    it('is true for a user cancel (cancellationRequested, not failed)', function () {
      expect(
        isDeliberateCancel({ ...baseTx, cancellationRequested: true }),
      ).toBe(true)
    })

    it('is true at the terminal RECOVERED state', function () {
      expect(
        isDeliberateCancel({
          ...baseTx,
          cancellationRequested: true,
          kind: 'REDEEM',
          status: 'RECOVERED',
        }),
      ).toBe(true)
    })

    it('is false for a keeper/Agent-failure recovery (failed)', function () {
      expect(
        isDeliberateCancel({
          ...baseTx,
          cancellationRequested: true,
          failed: true,
          status: 'RECOVERED',
        }),
      ).toBe(false)
    })

    it('is false without a cancel request', function () {
      expect(isDeliberateCancel(baseTx)).toBe(false)
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

  describe('isEarnRowTerminal', function () {
    it.each<EarnTransactionStatusType>(['FINALIZED', 'RECOVERED'])(
      'is true for the terminal status %s',
      function (status) {
        expect(isEarnRowTerminal({ ...baseTx, status })).toBe(true)
      },
    )

    it.each<EarnTransactionStatusType>([
      'CANCELLED',
      'FAILED',
      'FULFILLED',
      'PENDING',
      'TX_PENDING',
    ])('is false for the non-terminal status %s', function (status) {
      expect(isEarnRowTerminal({ ...baseTx, status })).toBe(false)
    })

    it('is false for a local FAILED row even though it is also out of flight', function () {
      const localFailed = {
        ...baseTx,
        requestId: 'local-1700000000',
        status: 'FAILED',
      } as EarnTransaction
      expect(isEarnRowTerminal(localFailed)).toBe(false)
      expect(isEarnRowInFlight(localFailed)).toBe(false)
    })
  })

  describe('isFinalizeInFlight', function () {
    it('is true when the Agent processed it (processedAt set)', function () {
      expect(isFinalizeInFlight({ ...baseTx, processedAt: '1700000100' })).toBe(
        true,
      )
    })

    it('is true while a non-failed UNSTAKE marker is mining', function () {
      expect(
        isFinalizeInFlight({
          ...baseTx,
          settlement: { failed: false, kind: 'UNSTAKE' },
        }),
      ).toBe(true)
    })

    it('is false for a failed UNSTAKE marker (real revert)', function () {
      expect(
        isFinalizeInFlight({
          ...baseTx,
          settlement: { failed: true, kind: 'UNSTAKE' },
        }),
      ).toBe(false)
    })

    it('ignores a CLAIM marker', function () {
      expect(
        isFinalizeInFlight({
          ...baseTx,
          settlement: { failed: false, kind: 'CLAIM' },
        }),
      ).toBe(false)
    })

    it('is false with no processedAt and no marker', function () {
      expect(isFinalizeInFlight(baseTx)).toBe(false)
    })

    it('is false for undefined', function () {
      expect(isFinalizeInFlight(undefined)).toBe(false)
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

  describe('isRemoteFailed', function () {
    const remoteFailed: EarnTransaction = {
      ...baseTx,
      failed: true,
      kind: 'REDEEM',
      requestId: '42',
      status: 'FAILED',
    }

    it('is true for a subgraph FAILED redeem flagged failed', function () {
      expect(isRemoteFailed(remoteFailed)).toBe(true)
    })

    it('is false for a local FAILED row (retryable from home)', function () {
      expect(
        isRemoteFailed({ ...remoteFailed, requestId: 'local-1700000000' }),
      ).toBe(false)
    })

    it('is false when the failed flag is not set', function () {
      expect(isRemoteFailed({ ...remoteFailed, failed: false })).toBe(false)
    })

    it('is true for a subgraph FAILED deposit flagged failed', function () {
      expect(isRemoteFailed({ ...remoteFailed, kind: 'DEPOSIT' })).toBe(true)
    })

    it('is false for a local FAILED deposit', function () {
      expect(
        isRemoteFailed({
          ...remoteFailed,
          kind: 'DEPOSIT',
          requestId: 'local-1700000000',
        }),
      ).toBe(false)
    })

    it('is false for a non-FAILED status', function () {
      expect(isRemoteFailed({ ...remoteFailed, status: 'PENDING' })).toBe(false)
    })

    it('is false for undefined', function () {
      expect(isRemoteFailed(undefined)).toBe(false)
    })
  })

  describe('isRemoteFailedCancel', function () {
    const remoteFailed: EarnTransaction = {
      ...baseTx,
      failed: true,
      kind: 'DEPOSIT',
      requestId: '42',
      status: 'FAILED',
    }

    it('is true for a remote-failed row with a CANCEL_REQUEST marker', function () {
      expect(
        isRemoteFailedCancel({
          ...remoteFailed,
          settlement: { failed: false, kind: 'CANCEL_REQUEST' },
        }),
      ).toBe(true)
    })

    it('is false for a remote-failed row with a RETRY marker', function () {
      expect(
        isRemoteFailedCancel({
          ...remoteFailed,
          settlement: { failed: false, kind: 'RETRY' },
        }),
      ).toBe(false)
    })

    it('is false for a remote-failed row without a settlement', function () {
      expect(isRemoteFailedCancel(remoteFailed)).toBe(false)
    })

    it('is false when the row is not remote-failed', function () {
      expect(
        isRemoteFailedCancel({
          ...remoteFailed,
          settlement: { failed: false, kind: 'CANCEL_REQUEST' },
          status: 'PENDING',
        }),
      ).toBe(false)
    })
  })

  describe('isUserCancel', function () {
    it('is true when cancellationRequested and not failed', function () {
      expect(
        isUserCancel({
          ...baseTx,
          cancellationRequested: true,
          status: 'CANCELLED',
        }),
      ).toBe(true)
    })

    it('is false for an Agent failure (cancellationRequested but failed)', function () {
      expect(
        isUserCancel({
          ...baseTx,
          cancellationRequested: true,
          failed: true,
          status: 'CANCELLED',
        }),
      ).toBe(false)
    })

    it('is false for an Agent failure even with a lingering CANCEL marker', function () {
      expect(
        isUserCancel({
          ...baseTx,
          failed: true,
          settlement: { failed: false, kind: 'CANCEL' },
          status: 'CANCELLED',
        }),
      ).toBe(false)
    })

    it('is true while a CANCEL marker is pending (bridges the indexing lag)', function () {
      expect(
        isUserCancel({
          ...baseTx,
          settlement: { failed: false, kind: 'CANCEL' },
        }),
      ).toBe(true)
    })

    it('is false for a reverted CANCEL marker (the modal owns that retry)', function () {
      expect(
        isUserCancel({
          ...baseTx,
          settlement: { failed: true, kind: 'CANCEL' },
        }),
      ).toBe(false)
    })

    it('is false once RECOVERED, even with cancellationRequested (terminal)', function () {
      expect(
        isUserCancel({
          ...baseTx,
          cancellationRequested: true,
          status: 'RECOVERED',
        }),
      ).toBe(false)
    })

    it('is false once FINALIZED with cancellationRequested (cancel lost the race)', function () {
      expect(
        isUserCancel({
          ...baseTx,
          cancellationRequested: true,
          kind: 'REDEEM',
          status: 'FINALIZED',
        }),
      ).toBe(false)
    })

    it('is false for a plain row (no flag, no marker)', function () {
      expect(isUserCancel(baseTx)).toBe(false)
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

  describe('shouldShowRemoteFailedCtas', function () {
    const stuckTx: EarnTransaction = {
      ...baseTx,
      failed: true,
      kind: 'REDEEM',
      receivedAt: '1000',
      requestId: '42',
      retryCount: 0,
      status: 'FAILED',
    }

    it('is false when not stuck on-chain', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'slippage',
          isStuck: false,
          nowSec: 999999,
          tx: stuckTx,
        }),
      ).toBe(false)
    })

    it('shows immediately for slippage (needs a user call)', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'slippage',
          isStuck: true,
          nowSec: 1001,
          tx: stuckTx,
        }),
      ).toBe(true)
    })

    it('shows once a keeper retry already failed', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'gas',
          isStuck: true,
          nowSec: 1001,
          tx: { ...stuckTx, retryCount: 1 },
        }),
      ).toBe(true)
    })

    it('shows after the grace elapses', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'gas',
          isStuck: true,
          nowSec: 1121,
          tx: stuckTx,
        }),
      ).toBe(true)
    })

    it('stays hidden within the grace window', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'gas',
          isStuck: true,
          nowSec: 1060,
          tx: stuckTx,
        }),
      ).toBe(false)
    })

    it('stays hidden with no receivedAt and no retries', function () {
      expect(
        shouldShowRemoteFailedCtas({
          category: 'unknown',
          isStuck: true,
          nowSec: 999999,
          tx: { ...stuckTx, receivedAt: null },
        }),
      ).toBe(false)
    })
  })
})
