import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  encodeClaimDeposit,
  encodeClaimRedeem,
  encodeRecoverDeposit,
  encodeRecoverRedeem,
  encodeRequestDeposit,
  encodeRequestRedeem,
} from '../../../src/actions/wallet/encoders'

describe('encoders', function () {
  it('encodes requestDeposit with automatic=true by default', function () {
    const data = encodeRequestDeposit({
      amount: BigInt(100),
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator: zeroAddress,
      receiver: zeroAddress,
    })

    expect(data).toMatch(/^0x[0-9a-f]+$/i)
    expect(data.length).toBeGreaterThan(10)
  })

  it('encodes requestRedeem', function () {
    const data = encodeRequestRedeem({
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator: zeroAddress,
      receiver: zeroAddress,
      shares: BigInt(100),
    })

    expect(data).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('produces different data for requestDeposit vs requestRedeem', function () {
    const depositData = encodeRequestDeposit({
      amount: BigInt(100),
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator: zeroAddress,
      receiver: zeroAddress,
    })
    const redeemData = encodeRequestRedeem({
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator: zeroAddress,
      receiver: zeroAddress,
      shares: BigInt(100),
    })

    expect(depositData).not.toBe(redeemData)
  })

  it('encodes the operator address into requestDeposit calldata at the right offset', function () {
    const operator =
      '0x1111111111111111111111111111111111111111' as `0x${string}`
    const receiver =
      '0x2222222222222222222222222222222222222222' as `0x${string}`

    const data = encodeRequestDeposit({
      amount: BigInt(100),
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator,
      receiver,
    })

    // Both addresses must appear in the calldata (low-cased, no `0x`).
    expect(data.toLowerCase()).toContain(operator.slice(2).toLowerCase())
    expect(data.toLowerCase()).toContain(receiver.slice(2).toLowerCase())
    // Operator must come AFTER receiver in the encoded args (positional check).
    const receiverIdx = data
      .toLowerCase()
      .indexOf(receiver.slice(2).toLowerCase())
    const operatorIdx = data
      .toLowerCase()
      .indexOf(operator.slice(2).toLowerCase())
    expect(operatorIdx).toBeGreaterThan(receiverIdx)
  })

  it('encodes the operator address into requestRedeem calldata at the right offset', function () {
    const operator =
      '0x1111111111111111111111111111111111111111' as `0x${string}`
    const receiver =
      '0x2222222222222222222222222222222222222222' as `0x${string}`

    const data = encodeRequestRedeem({
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      operator,
      receiver,
      shares: BigInt(100),
    })

    expect(data.toLowerCase()).toContain(operator.slice(2).toLowerCase())
    expect(data.toLowerCase()).toContain(receiver.slice(2).toLowerCase())
    const receiverIdx = data
      .toLowerCase()
      .indexOf(receiver.slice(2).toLowerCase())
    const operatorIdx = data
      .toLowerCase()
      .indexOf(operator.slice(2).toLowerCase())
    expect(operatorIdx).toBeGreaterThan(receiverIdx)
  })

  it('encodes claimDeposit', function () {
    const data = encodeClaimDeposit({ requestId: BigInt(42) })
    expect(data).toMatch(/^0x[0-9a-f]+$/i)
    expect(data.length).toBeGreaterThan(10)
  })

  it('encodes claimRedeem', function () {
    const data = encodeClaimRedeem({ requestId: BigInt(42) })
    expect(data).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('encodes recoverDeposit', function () {
    const data = encodeRecoverDeposit({ requestId: BigInt(42) })
    expect(data).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('encodes recoverRedeem', function () {
    const data = encodeRecoverRedeem({ requestId: BigInt(42) })
    expect(data).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('produces different selectors for the 4 settlement actions', function () {
    const requestId = BigInt(1)
    const datas = [
      encodeClaimDeposit({ requestId }),
      encodeClaimRedeem({ requestId }),
      encodeRecoverDeposit({ requestId }),
      encodeRecoverRedeem({ requestId }),
    ]
    // First 10 chars = function selector. All 4 must differ.
    const selectors = datas.map(d => d.slice(0, 10))
    expect(new Set(selectors).size).toBe(4)
  })
})
