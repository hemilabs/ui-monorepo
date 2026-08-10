import { describe, expect, it } from 'vitest'

import { resolveApprovalAmount } from '../src/utils'

describe('resolveApprovalAmount', function () {
  it('falls back to the required amount when no approval amount is given', function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: undefined,
        required: BigInt(100),
      }),
    ).toBe(BigInt(100))
  })

  it('honours a larger approval amount', function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(1000),
        required: BigInt(100),
      }),
    ).toBe(BigInt(1000))
  })

  // The invariant: a smaller allowance than what the transaction pulls makes the
  // request revert on transfer, which is what the redeem dust snap used to cause.
  it('ignores an approval amount below what the transaction pulls', function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(99),
        required: BigInt(100),
      }),
    ).toBe(BigInt(100))
  })

  it('ignores an approval amount equal to the required one', function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(100),
        required: BigInt(100),
      }),
    ).toBe(BigInt(100))
  })

  it('never returns below the required amount for a zero approval amount', function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(0),
        required: BigInt(100),
      }),
    ).toBe(BigInt(100))
  })
})
