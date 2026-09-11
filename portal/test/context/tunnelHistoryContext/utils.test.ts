import {
  getTunnelHistoryDepositStorageKey,
  getTunnelHistoryWithdrawStorageKey,
} from 'context/tunnelHistoryContext/utils'
import { describe, expect, it } from 'vitest'

const address = '0x1234567890123456789012345678901234567890'
const l1ChainId = 11155111
const l2ChainId = 743111

describe('context/tunnelHistoryContext/utils', function () {
  describe('storage keys', function () {
    it('should not change the deposits key, as that discards the synced history', function () {
      expect(
        getTunnelHistoryDepositStorageKey(l1ChainId, l2ChainId, address),
      ).toBe(
        'portal.transaction-history-11155111-743111-0x1234567890123456789012345678901234567890-deposits',
      )
    })

    it('should not change the withdrawals key, as that discards the synced history', function () {
      expect(
        getTunnelHistoryWithdrawStorageKey(l1ChainId, l2ChainId, address),
      ).toBe(
        'portal.transaction-history-11155111-743111-0x1234567890123456789012345678901234567890-withdrawals',
      )
    })
  })
})
