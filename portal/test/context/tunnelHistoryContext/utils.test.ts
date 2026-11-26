import {
  getTunnelHistoryDepositStorageKey,
  getTunnelHistoryWithdrawStorageKey,
  syncContent,
} from 'context/tunnelHistoryContext/utils'
import { type EvmDepositOperation } from 'types/tunnel'
import { describe, expect, it } from 'vitest'

const address = '0x1234567890123456789012345678901234567890'
const l1ChainId = 11155111
const l2ChainId = 743111

describe('context/tunnelHistoryContext/utils', function () {
  describe('mergeContent', function () {
    it('preserves the object for a non-duplicated operation', function () {
      const stored = {
        transactionHash: '0xstored',
      } as EvmDepositOperation
      const result = syncContent(
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [stored],
          fromBlock: 0,
          status: 'finished',
        },
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [],
          fromBlock: 0,
        },
      )

      expect(result.content[0]).toBe(stored)
    })

    it('sorts operations by timestamp in descending order', function () {
      const oldest = {
        amount: '1',
        direction: 0,
        from: '0xfrom',
        l1ChainId,
        l1Token: '0xl1',
        l2ChainId,
        l2Token: '0xl2',
        timestamp: 100,
        to: '0xto',
        transactionHash: '0xoldest',
      } as EvmDepositOperation
      const middle = {
        ...oldest,
        timestamp: 200,
        transactionHash: '0xmiddle',
      }
      const newest = {
        ...oldest,
        timestamp: 300,
        transactionHash: '0xnewest',
      }

      const result = syncContent(
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [oldest, newest],
          fromBlock: 0,
          status: 'finished',
        },
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [middle],
          fromBlock: 0,
        },
      )

      expect(
        result.content.map(({ transactionHash }) => transactionHash),
      ).toEqual(['0xnewest', '0xmiddle', '0xoldest'])
    })

    it('merges synced fields into stored duplicate operations', function () {
      const stored = {
        amount: '1',
        direction: 0,
        from: '0xfrom',
        l1ChainId,
        l1Token: '0xl1',
        l2ChainId,
        l2Token: '0xl2',
        status: 2,
        to: '0xto',
        transactionHash: '0xduplicate',
      } as EvmDepositOperation
      const synced = {
        ...stored,
        status: undefined,
        timestamp: 123,
      }

      const result = syncContent(
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [stored],
          fromBlock: 0,
          status: 'finished',
        },
        {
          chainId: l1ChainId,
          chunkIndex: 0,
          content: [synced],
          fromBlock: 0,
        },
      )

      expect(result.content).toEqual([
        {
          ...synced,
          status: 2,
        },
      ])
    })
  })

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
