import { type EvmDepositOperation } from 'types/tunnel'
import { zeroHash } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  analyzeEvmDepositPolling,
  EvmDepositPriority,
} from 'workers/pollings/analyzeEvmDepositPolling'

const getSeconds = (seconds: number) => seconds * 1000

const createDeposit = (
  overrides: Partial<EvmDepositOperation> = {},
): EvmDepositOperation =>
  // @ts-expect-error Only required fields for testing
  ({
    status: 1,
    timestamp: 123456,
    transactionHash: zeroHash,
    ...overrides,
  })

describe('analyzeEvmDepositPolling', function () {
  it('returns HIGH priority and short interval for focused deposit', function () {
    const deposit = createDeposit()
    const result = analyzeEvmDepositPolling({
      deposit,
      focusedDepositHash: zeroHash,
    })

    expect(result.priority).toBe(EvmDepositPriority.HIGH)
    expect(result.interval).toBe(getSeconds(7))
  })

  it('returns MEDIUM priority when timestamp is missing', function () {
    const deposit = createDeposit({ timestamp: undefined })
    const result = analyzeEvmDepositPolling({ deposit })

    expect(result.priority).toBe(EvmDepositPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns MEDIUM priority when status is undefined', function () {
    const deposit = createDeposit({ status: undefined })
    const result = analyzeEvmDepositPolling({ deposit })

    expect(result.priority).toBe(EvmDepositPriority.MEDIUM)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns LOW priority and fallback interval when all data is present and not focused', function () {
    const deposit = createDeposit()
    const result = analyzeEvmDepositPolling({ deposit })

    expect(result.priority).toBe(EvmDepositPriority.LOW)
    expect(result.interval).toBe(getSeconds(28))
  })
})
