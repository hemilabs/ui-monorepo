import { encodeErrorResult } from 'viem'
import { describe, expect, it } from 'vitest'

import { decodeFailureReason } from '../../../../../app/[locale]/hemi-earn/_utils/decodeFailureReason'

const errorStringAbi = [
  { inputs: [{ type: 'string' }], name: 'Error', type: 'error' },
] as const

const panicAbi = [
  { inputs: [{ type: 'uint256' }], name: 'Panic', type: 'error' },
] as const

const insufficientFeeAbi = [
  {
    inputs: [
      { name: 'provided', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
    name: 'InsufficientFee',
    type: 'error',
  },
] as const

const boomAbi = [{ inputs: [], name: 'Boom', type: 'error' }] as const

const errorString = (message: string) =>
  encodeErrorResult({
    abi: errorStringAbi,
    args: [message],
    errorName: 'Error',
  })

describe('decodeFailureReason', function () {
  it('treats empty / missing returndata as gas', function () {
    expect(decodeFailureReason(undefined)).toBe('gas')
    expect(decodeFailureReason(null)).toBe('gas')
    expect(decodeFailureReason('')).toBe('gas')
    expect(decodeFailureReason('0x')).toBe('gas')
  })

  it('maps InsufficientFee to gas', function () {
    const data = encodeErrorResult({
      abi: insufficientFeeAbi,
      args: [BigInt(1), BigInt(2)],
      errorName: 'InsufficientFee',
    })
    expect(decodeFailureReason(data)).toBe('gas')
  })

  it('maps a slippage-worded Error(string) to slippage', function () {
    expect(decodeFailureReason(errorString('slippage exceeded'))).toBe(
      'slippage',
    )
    expect(decodeFailureReason(errorString('Too little received'))).toBe(
      'slippage',
    )
    expect(decodeFailureReason(errorString('insufficient output amount'))).toBe(
      'slippage',
    )
  })

  it('maps an unrelated Error(string) to unknown', function () {
    expect(
      decodeFailureReason(errorString('GatewayMock: deposit failed')),
    ).toBe('unknown')
  })

  it('maps Panic to unknown', function () {
    const data = encodeErrorResult({
      abi: panicAbi,
      args: [BigInt(0x11)],
      errorName: 'Panic',
    })
    expect(decodeFailureReason(data)).toBe('unknown')
  })

  it('maps an unrecognized custom error to unknown', function () {
    const data = encodeErrorResult({ abi: boomAbi, errorName: 'Boom' })
    expect(decodeFailureReason(data)).toBe('unknown')
  })
})
