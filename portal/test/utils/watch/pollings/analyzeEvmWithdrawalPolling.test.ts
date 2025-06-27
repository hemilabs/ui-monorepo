import {
  MessageDirection,
  MessageStatus,
  type ToEvmWithdrawOperation,
} from 'types/tunnel'
import { zeroHash } from 'viem'
import { hemiSepolia, sepolia } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
  analyzeEvmWithdrawalPolling,
  EvmWithdrawalPriority,
} from 'workers/pollings/analyzeEvmWithdrawalPolling'

const getSeconds = (seconds: number) => seconds * 1000
const getMinutes = (minutes: number) => getSeconds(minutes * 60)

const createWithdrawal = (
  overrides: Partial<ToEvmWithdrawOperation> = {},
): ToEvmWithdrawOperation =>
  // @ts-expect-error Only adding the minimum required properties for testing
  ({
    claimTxHash: zeroHash,
    direction: MessageDirection.L2_TO_L1,
    l1ChainId: sepolia.id,
    l2ChainId: hemiSepolia.id,
    proveTxHash: zeroHash,
    status: MessageStatus.RELAYED,
    timestamp: 123456,
    transactionHash: zeroHash,
    ...overrides,
  })

describe('analyzeEvmWithdrawalPolling', function () {
  it('returns HIGH priority and 7s interval for focused withdrawal', function () {
    const withdrawal = createWithdrawal()
    const result = analyzeEvmWithdrawalPolling({
      focusedWithdrawalHash: zeroHash,
      withdrawal,
    })
    expect(result.priority).toBe(EvmWithdrawalPriority.HIGH)
    expect(result.interval).toBe(getSeconds(7))
  })

  it('returns MEDIUM priority and 14s interval if status is missing', function () {
    const withdrawal = createWithdrawal({ status: undefined })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns LOW priority and default mapped interval for unrelated status', function () {
    const withdrawal = createWithdrawal({
      status: MessageStatus.RELAYED,
    })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.LOW)
    expect(result.interval).toBe(getMinutes(3))
  })

  it('returns LOW priority and fallback interval if mapping is missing', function () {
    const withdrawal = createWithdrawal({
      l2ChainId: 99999, // unknown chain
    })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.LOW)
    expect(result.interval).toBe(getSeconds(28))
  })
})
