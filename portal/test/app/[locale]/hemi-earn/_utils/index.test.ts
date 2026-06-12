import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  formatApyDisplay,
  getTerminalDeliveryTxHash,
  hashesMatch,
} from '../../../../../app/[locale]/hemi-earn/_utils'
import {
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
    it('should return "< 0.01%" for values less than 0.01', function () {
      expect(formatApyDisplay(0.005)).toBe('< 0.01%')
    })

    it('should return "< 0.01%" for zero', function () {
      expect(formatApyDisplay(0)).toBe('< 0.01%')
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
