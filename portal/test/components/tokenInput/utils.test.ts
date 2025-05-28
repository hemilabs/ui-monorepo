import { validateInput } from 'components/tokenInput/utils'
import { parseTokenUnits } from 'utils/token'
import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

// Minimal valid Token mock for tests
const mockToken = (overrides = {}) => ({
  address: '0x0000000000000000000000000000000000000001',
  chainId: 1,
  decimals: 18,
  name: 'Mock Token',
  symbol: 'MOCK',
  ...overrides,
})

// Minimal t mock for tests, cast as any to bypass type checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = ((key: string) => key) as any

const token = mockToken()
// Common base params for validateInput
const params = {
  amountInput: '0',
  balance: parseTokenUnits('100', token),
  operation: 'deposit' as const,
  t,
  token,
}

describe('validateInput', function () {
  it('returns error for zero amount', function () {
    const result = validateInput({
      ...params,
      amountInput: '0',
    })
    expect(result).toEqual({
      error: 'common.enter-an-amount',
      errorKey: 'enter-an-amount',
      isValid: false,
    })
  })

  it('returns error for negative amount', function () {
    const result = validateInput({
      ...params,
      amountInput: '-1',
    })
    expect(result).toEqual({
      error: 'common.enter-an-amount',
      errorKey: 'enter-an-amount',
      isValid: false,
    })
  })

  it('returns error for native token with amount equals balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '100',
      token: mockToken({ address: zeroAddress, symbol: 'ETH' }),
    })
    expect(result).toEqual({
      error: 'common.insufficient-balance',
      errorKey: 'insufficient-balance',
      isValid: false,
    })
  })

  it('returns error for native token with amount bigger than balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '101',
      token: mockToken({ address: zeroAddress, symbol: 'ETH' }),
    })
    expect(result).toEqual({
      error: 'common.insufficient-balance',
      errorKey: 'insufficient-balance',
      isValid: false,
    })
  })

  it('returns error for non-native token with amount > balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '101',
      token: mockToken({ symbol: 'DAI' }),
    })
    expect(result).toEqual({
      error: 'common.insufficient-balance',
      errorKey: 'insufficient-balance',
      isValid: false,
    })
  })

  it('returns valid for native token with amount < balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '99',
      token: mockToken({ symbol: 'ETH' }),
    })
    expect(result).toEqual({
      error: undefined,
      errorKey: undefined,
      isValid: true,
    })
  })

  it('returns valid for non-native token with amount smaller than balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '99',
      token: mockToken({ symbol: 'DAI' }),
    })
    expect(result).toEqual({
      error: undefined,
      errorKey: undefined,
      isValid: true,
    })
  })

  it('returns valid for non-native token with amount equal to balance', function () {
    const result = validateInput({
      ...params,
      amountInput: '100',
      token: mockToken({ symbol: 'DAI' }),
    })
    expect(result).toEqual({
      error: undefined,
      errorKey: undefined,
      isValid: true,
    })
  })

  it('returns error for amount smaller than minimum representable value', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.00000000000000000001', // smaller than 18 decimals
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns error for amountInput like "0.000" (all zeros)', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.000',
    })
    expect(result).toEqual({
      error: 'common.enter-an-amount',
      errorKey: 'enter-an-amount',
      isValid: false,
    })
  })

  it('returns error for amountInput like "0.00000000000000000001" (less than min value)', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.00000000000000000001',
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns error for amountInput like "0.0000000000000000000020000" (less than min value)', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.0000000000000000000020000',
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns error for amountInput like "0.00000000000000000010" (less than min value)', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.00000000000000000010',
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns error for amountInput like "0.0001" if the min amount is "0.01"', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.0001',
      minAmount: '0.01',
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns error for amountInput slightly less than the minimum amount, rounding properly', function () {
    const result = validateInput({
      ...params,
      amountInput: '0.009',
      minAmount: '0.01',
      token: mockToken({ decimals: 2 }),
    })
    expect(result).toEqual({
      error: 'common.min-amount-deposit',
      errorKey: 'less-than-min-value',
      isValid: false,
    })
  })

  it('returns valid for an amountInput equal to the min amount', function () {
    const amountInput = '0.01'
    const result = validateInput({
      ...params,
      amountInput,
      minAmount: amountInput,
    })
    expect(result).toEqual({
      error: undefined,
      errorKey: undefined,
      isValid: true,
    })
  })
})
