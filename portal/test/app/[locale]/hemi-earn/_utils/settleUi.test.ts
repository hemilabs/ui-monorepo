import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { mainnet } from 'networks/mainnet'
import { type Hash } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  getTerminalDeliveryTxHash,
  pickSettleBannerKey,
  remoteFailedStepStatus,
  resolveSettleStepStatus,
  resolveStepExplorerChainId,
} from '../../../../../app/[locale]/hemi-earn/_utils/settleUi'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../../../app/[locale]/hemi-earn/types'

import { baseTx, claimHash, recoverHash } from './fixtures'

describe('settleUi', function () {
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

    it('returns undefined while a claim/recover is pending (settlement marker)', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          settlement: { failed: false, kind: 'CLAIM' },
          status: 'FULFILLED',
        }),
      ).toBeUndefined()
    })

    it('returns undefined after a reverted settlement (try-again state)', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          settlement: { failed: true, kind: 'RECOVER' },
          status: 'CANCELLED',
        }),
      ).toBeUndefined()
    })

    it('returns "cancelled" for a user-cancelled redeem (indexed flag)', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          cancellationRequested: true,
          kind: 'REDEEM',
          status: 'CANCELLED',
        }),
      ).toBe('cancelled')
    })

    it('returns undefined once a user-cancelled redeem is RECOVERED', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          cancellationRequested: true,
          kind: 'REDEEM',
          status: 'RECOVERED',
        }),
      ).toBeUndefined()
    })

    it('returns undefined when a cancelled redeem FINALIZED (cancel lost the race)', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          cancellationRequested: true,
          kind: 'REDEEM',
          status: 'FINALIZED',
        }),
      ).toBeUndefined()
    })

    it('returns "cancelled" while a CANCEL marker is pending (before indexing)', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          kind: 'REDEEM',
          settlement: { failed: false, kind: 'CANCEL' },
          status: 'PENDING',
        }),
      ).toBe('cancelled')
    })

    it('shows the recover banner for an Agent failure despite a CANCEL marker', function () {
      expect(
        pickSettleBannerKey({
          ...baseTx,
          failed: true,
          kind: 'REDEEM',
          settlement: { failed: false, kind: 'CANCEL' },
          status: 'CANCELLED',
        }),
      ).toBe('recover-shares')
    })
  })

  describe('remoteFailedStepStatus', function () {
    it('is FAILED when ready and nothing in flight', function () {
      expect(remoteFailedStepStatus(true, undefined)).toBe(
        ProgressStatus.FAILED,
      )
    })

    it('is in progress while a retry/cancel is in flight', function () {
      expect(
        remoteFailedStepStatus(true, { failed: false, kind: 'RETRY' }),
      ).toBe(ProgressStatus.PROGRESS)
      expect(
        remoteFailedStepStatus(true, { failed: false, kind: 'CANCEL_REQUEST' }),
      ).toBe(ProgressStatus.PROGRESS)
    })

    it('is FAILED again once the retry/cancel reverted', function () {
      expect(
        remoteFailedStepStatus(true, { failed: true, kind: 'RETRY' }),
      ).toBe(ProgressStatus.FAILED)
    })

    it('is in progress during the grace (not ready yet)', function () {
      expect(remoteFailedStepStatus(false, undefined)).toBe(
        ProgressStatus.PROGRESS,
      )
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

  describe('resolveStepExplorerChainId', function () {
    const fallbackChainId = 999
    const recoveryHash = '0xaaa' as Hash

    it('is undefined when there is no tx hash', function () {
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: {
            failed: false,
            kind: 'CANCEL_REQUEST',
            txHash: recoveryHash,
          },
          txHash: undefined,
        }),
      ).toBeUndefined()
    })

    it('links a remote-failed retry/cancel tx to mainnet', function () {
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: {
            failed: false,
            kind: 'CANCEL_REQUEST',
            txHash: recoveryHash,
          },
          txHash: recoveryHash,
        }),
      ).toBe(mainnet.id)
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: { failed: false, kind: 'RETRY', txHash: recoveryHash },
          txHash: recoveryHash,
        }),
      ).toBe(mainnet.id)
    })

    it('uses the fallback chain when the hash is not the recovery tx', function () {
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: {
            failed: false,
            kind: 'CANCEL_REQUEST',
            txHash: recoveryHash,
          },
          txHash: '0xbbb' as Hash,
        }),
      ).toBe(fallbackChainId)
    })

    it('uses the fallback chain for a non-remote-failed settlement', function () {
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: { failed: false, kind: 'CLAIM', txHash: recoveryHash },
          txHash: recoveryHash,
        }),
      ).toBe(fallbackChainId)
    })

    it('uses the fallback chain when there is no settlement', function () {
      expect(
        resolveStepExplorerChainId({
          fallbackChainId,
          settlement: undefined,
          txHash: recoveryHash,
        }),
      ).toBe(fallbackChainId)
    })
  })
})
