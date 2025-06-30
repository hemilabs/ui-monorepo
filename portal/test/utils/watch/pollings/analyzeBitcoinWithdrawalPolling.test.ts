import { BtcWithdrawStatus, type ToBtcWithdrawOperation } from 'types/tunnel'
import { zeroHash } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  analyzeBitcoinWithdrawalPolling,
  BitcoinWithdrawalPriority,
} from 'workers/pollings/analyzeBitcoinWithdrawalPolling'

const getSeconds = (seconds: number) => seconds * 1000

const createWithdrawal = (
  overrides: Partial<ToBtcWithdrawOperation> = {},
): ToBtcWithdrawOperation =>
  // @ts-expect-error Only required fields for testing
  ({
    timestamp: 123456,
    transactionHash: zeroHash,
    ...overrides,
  })

describe('analyzeBitcoinWithdrawalPolling', function () {
  it('returns MAX priority and interval 7s for focused withdrawal', function () {
    const withdrawal = createWithdrawal()
    const result = analyzeBitcoinWithdrawalPolling({
      focusedWithdrawalHash: zeroHash,
      withdrawal,
    })

    expect(result.priority).toBe(BitcoinWithdrawalPriority.MAX)
    expect(result.interval).toBe(getSeconds(7))
  })

  it('returns HIGH priority and interval 14s for CHALLENGE_IN_PROGRESS status', function () {
    const withdrawal = createWithdrawal({
      status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
    })
    const result = analyzeBitcoinWithdrawalPolling({ withdrawal })

    expect(result.priority).toBe(BitcoinWithdrawalPriority.HIGH)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns HIGH priority and interval 14s for INITIATE_WITHDRAW_PENDING status', function () {
    const withdrawal = createWithdrawal({
      status: BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
    })
    const result = analyzeBitcoinWithdrawalPolling({ withdrawal })

    expect(result.priority).toBe(BitcoinWithdrawalPriority.HIGH)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns MEDIUM priority and interval 18s for pending operation', function () {
    const withdrawal = createWithdrawal()
    const result = analyzeBitcoinWithdrawalPolling({ withdrawal })

    expect(result.priority).toBe(BitcoinWithdrawalPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(18))
  })

  it('returns LOW priority and interval 28s for default case', function () {
    const withdrawal = createWithdrawal({
      status: BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
    })
    const result = analyzeBitcoinWithdrawalPolling({ withdrawal })

    expect(result.priority).toBe(BitcoinWithdrawalPriority.LOW)
    expect(result.interval).toBe(getSeconds(28))
  })
})
