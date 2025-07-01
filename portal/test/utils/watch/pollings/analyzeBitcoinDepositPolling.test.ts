import { type BtcDepositOperation } from 'types/tunnel'
import { zeroHash } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  analyzeBitcoinDepositPolling,
  BitcoinDepositPriority,
} from 'workers/pollings/analyzeBitcoinDepositPolling'

const getSeconds = (seconds: number) => seconds * 1000

const createDeposit = (
  overrides: Partial<BtcDepositOperation> = {},
): BtcDepositOperation =>
  // @ts-expect-error Only required fields for testing
  ({
    status: 1,
    timestamp: 123456,
    transactionHash: zeroHash,
    ...overrides,
  })

describe('analyzeBitcoinDepositPolling', function () {
  it('returns HIGH priority and short interval for focused deposit', function () {
    const deposit = createDeposit()
    const result = analyzeBitcoinDepositPolling({
      deposit,
      focusedDepositHash: zeroHash,
    })

    expect(result.priority).toBe(BitcoinDepositPriority.HIGH)
    expect(result.interval).toBe(getSeconds(14))
  })

  it('returns LOW priority and fallback interval when all data is present and not focused', function () {
    const deposit = createDeposit()
    const result = analyzeBitcoinDepositPolling({ deposit })

    expect(result.priority).toBe(BitcoinDepositPriority.LOW)
    expect(result.interval).toBe(getSeconds(28))
  })
})
