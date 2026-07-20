import { describe, expect, it } from 'vitest'

import { computeCrossChainFees } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_utils/crossChainFees'

describe('computeCrossChainFees', function () {
  it('splits layerZeroFee into bridging + ethereum when a quote is present', function () {
    expect(
      computeCrossChainFees({
        layerZeroFee: BigInt(1000),
        quote: { callbackFee: BigInt(400) },
      }),
    ).toEqual({ bridgingFee: BigInt(600), ethereumFee: BigInt(400) })
  })

  it('clamps bridgingFee to zero when callbackFee exceeds layerZeroFee', function () {
    expect(
      computeCrossChainFees({
        layerZeroFee: BigInt(300),
        quote: { callbackFee: BigInt(500) },
      }),
    ).toEqual({ bridgingFee: BigInt(0), ethereumFee: BigInt(500) })
  })

  it('returns undefined fees when the quote is undefined', function () {
    expect(
      computeCrossChainFees({ layerZeroFee: BigInt(0), quote: undefined }),
    ).toEqual({ bridgingFee: undefined, ethereumFee: undefined })
  })

  it('splits into parts that sum back to layerZeroFee', function () {
    expect(
      computeCrossChainFees({
        layerZeroFee: BigInt(1500),
        quote: { callbackFee: BigInt(500) },
      }),
    ).toEqual({ bridgingFee: BigInt(1000), ethereumFee: BigInt(500) })
  })
})
