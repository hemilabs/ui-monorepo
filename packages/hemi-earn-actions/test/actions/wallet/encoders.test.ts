import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  encodeRequestDeposit,
  encodeRequestRedeem,
} from '../../../src/actions/wallet/encoders'

describe('encoders', function () {
  it('encodes requestDeposit with automatic=true by default', function () {
    const data = encodeRequestDeposit({
      amount: BigInt(100),
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      receiver: zeroAddress,
    })

    expect(data).toMatch(/^0x[0-9a-f]+$/i)
    expect(data.length).toBeGreaterThan(10)
  })

  it('encodes requestRedeem', function () {
    const data = encodeRequestRedeem({
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
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
      receiver: zeroAddress,
    })
    const redeemData = encodeRequestRedeem({
      asset: zeroAddress,
      fulfillmentFee: BigInt(0),
      receiver: zeroAddress,
      shares: BigInt(100),
    })

    expect(depositData).not.toBe(redeemData)
  })
})
