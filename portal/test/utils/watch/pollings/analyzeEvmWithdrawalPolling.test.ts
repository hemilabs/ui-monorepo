import {
  MessageDirection,
  MessageStatus,
  type ToEvmWithdrawOperation,
} from 'types/tunnel'
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
    claimTxHash: '0x456',
    direction: MessageDirection.L2_TO_L1,
    l1ChainId: sepolia.id,
    l2ChainId: hemiSepolia.id,
    proveTxHash: '0x123',
    status: MessageStatus.RELAYED,
    timestamp: 123456,
    transactionHash: '0xabc',
    ...overrides,
  })

describe('analyzeEvmWithdrawalPolling', function () {
  it('returns MAX priority and 6s interval for focused withdrawal', function () {
    const withdrawal = createWithdrawal()
    const result = analyzeEvmWithdrawalPolling({
      focusedWithdrawalHash: '0xabc',
      withdrawal,
    })
    expect(result.priority).toBe(EvmWithdrawalPriority.MAX)
    expect(result.interval).toBe(getSeconds(6))
  })

  it('returns HIGH priority and 8s interval if timestamp is missing', function () {
    const withdrawal = createWithdrawal({ timestamp: undefined })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.HIGH)
    expect(result.interval).toBe(getSeconds(8))
  })

  it('returns MEDIUM priority and 10s interval if proveTxHash is missing and status requires it', function () {
    const withdrawal = createWithdrawal({
      proveTxHash: undefined,
      status: MessageStatus.READY_FOR_RELAY,
    })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(10))
  })

  it('returns MEDIUM priority and 10s interval for READY_TO_PROVE status', function () {
    const withdrawal = createWithdrawal({
      status: MessageStatus.READY_TO_PROVE,
    })
    const result = analyzeEvmWithdrawalPolling({ withdrawal })
    expect(result.priority).toBe(EvmWithdrawalPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(10))
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
    expect(result.interval).toBe(getSeconds(12))
  })
})
