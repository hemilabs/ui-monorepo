import { hemiSepolia } from 'hemi-viem'
import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'

import { MaxLockDurationSeconds, MinLockDurationSeconds } from '../constants'
import { validateCreateLockInputs } from '../utils'

describe('validateCreateLockInputs', function () {
  const validParams = {
    account: '0x1234567890123456789012345678901234567890' as const,
    amount: BigInt(100),
    approvalAmount: BigInt(100),
    chainId: hemiSepolia.id,
    lockDurationInSeconds: 30 * 24 * 60 * 60, // 30 days
  }

  it('should return undefined for valid inputs', function () {
    expect(validateCreateLockInputs(validParams)).toBeUndefined()
  })

  it('should return error for invalid account', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        account: 'invalid',
      }),
    ).toBe('account is not a valid address')
  })

  it('should return error for zero account', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        account: zeroAddress,
      }),
    ).toBe('account cannot be zero address')
  })

  it('should return error for zero amount', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        amount: BigInt(0),
      }),
    ).toBe('amount cannot be zero')
  })

  it('should return error for negative amounts', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        amount: -BigInt(1),
      }),
    ).toBe('amount cannot be negative')
  })

  it('should return error for short lock duration', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        lockDurationInSeconds: MinLockDurationSeconds - 1,
      }),
    ).toBe('lock duration is too short')
  })

  it('should return error for long lock duration', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        lockDurationInSeconds: MaxLockDurationSeconds + 1,
      }),
    ).toBe('lock duration is too long (maximum 4 years)')
  })

  it('should return error for unsupported chain', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        chainId: 999999,
      }),
    ).toBe('chain is not supported')
  })

  it('should accept minimum valid lock duration', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        lockDurationInSeconds: MinLockDurationSeconds,
      }),
    ).toBeUndefined()
  })

  it('should accept maximum valid lock duration', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        lockDurationInSeconds: MaxLockDurationSeconds,
      }),
    ).toBeUndefined()
  })

  it('should return error when approval amount is less than amount', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        approvalAmount: validParams.amount - BigInt(1),
      }),
    ).toBe('approval amount cannot be less than amount')
  })

  it('should accept when approval amount equals amount', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        approvalAmount: validParams.amount,
      }),
    ).toBeUndefined()
  })

  it('should accept when approval amount is greater than amount', function () {
    expect(
      validateCreateLockInputs({
        ...validParams,
        approvalAmount: validParams.amount + BigInt(1),
      }),
    ).toBeUndefined()
  })

  it('should use amount as default approval amount when not provided', function () {
    const { approvalAmount, ...newParams } = validParams
    expect(validateCreateLockInputs(newParams)).toBeUndefined()
  })
})
