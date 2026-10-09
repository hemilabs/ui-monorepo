import { describe, expect, it } from 'vitest'

import {
  areFeesPending,
  computeIsLoading,
  resolveErrorKey,
  resolveInsufficientFeesError,
  resolvePreviewIssue,
  resolveValidationError,
} from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_utils/formState'

describe('resolvePreviewIssue', function () {
  const base = {
    hasShares: true,
    isPreviewError: false,
    isPreviewLoading: false,
    peggedAmount: BigInt(100),
    validInput: true,
  }

  it('returns undefined when input is invalid', function () {
    expect(resolvePreviewIssue({ ...base, validInput: false })).toBeUndefined()
  })

  it('returns undefined while the preview is loading', function () {
    expect(
      resolvePreviewIssue({ ...base, isPreviewLoading: true }),
    ).toBeUndefined()
  })

  it('returns network-error when the preview query errored', function () {
    expect(resolvePreviewIssue({ ...base, isPreviewError: true })).toBe(
      'network-error',
    )
  })

  it('returns asset-unavailable when peggedAmount is 0n', function () {
    expect(
      resolvePreviewIssue({
        ...base,
        hasShares: false,
        peggedAmount: BigInt(0),
      }),
    ).toBe('asset-unavailable')
  })

  it('returns amount-too-small only when peggedAmount > 0 but shares missing', function () {
    expect(resolvePreviewIssue({ ...base, hasShares: false })).toBe(
      'amount-too-small',
    )
  })

  it('returns undefined on the happy path', function () {
    expect(resolvePreviewIssue(base)).toBeUndefined()
  })

  it('prefers network-error over asset-unavailable when both signals fire', function () {
    expect(
      resolvePreviewIssue({
        ...base,
        hasShares: false,
        isPreviewError: true,
        peggedAmount: BigInt(0),
      }),
    ).toBe('network-error')
  })

  it('treats peggedAmount=undefined as still loading data, not asset-unavailable', function () {
    expect(
      resolvePreviewIssue({
        ...base,
        hasShares: false,
        peggedAmount: undefined,
      }),
    ).toBeUndefined()
  })
})

describe('resolveErrorKey', function () {
  it('returns the errorKey when connected and balance loaded', function () {
    expect(resolveErrorKey(true, true, 'too-low')).toBe('too-low')
  })

  it('returns undefined when wallet is disconnected', function () {
    expect(resolveErrorKey(false, true, 'too-low')).toBeUndefined()
  })

  it('returns undefined while the balance is still loading', function () {
    expect(resolveErrorKey(true, false, 'too-low')).toBeUndefined()
  })

  it('returns undefined when the errorKey itself is undefined', function () {
    expect(resolveErrorKey(true, true, undefined)).toBeUndefined()
  })
})

describe('areFeesPending', function () {
  const base = {
    canSubmit: true,
    isFeesError: false,
    totalFees: undefined,
  }

  it('is pending while the fees are still unknown', function () {
    expect(areFeesPending(base)).toBe(true)
  })

  it('is not pending once the fees resolve', function () {
    expect(areFeesPending({ ...base, totalFees: BigInt(100) })).toBe(false)
  })

  it('is not pending when the fees errored', function () {
    expect(areFeesPending({ ...base, isFeesError: true })).toBe(false)
  })

  it('is not pending when the operation cannot be estimated', function () {
    expect(areFeesPending({ ...base, canSubmit: false })).toBe(false)
  })
})

describe('computeIsLoading', function () {
  const base = {
    balanceLoaded: true,
    feesPending: false,
    isAllowanceLoading: false,
    isNativeBalancePending: false,
    isPreviewLoading: false,
    validInput: true,
  }

  it('reports loading while the fees are still being estimated', function () {
    expect(computeIsLoading({ ...base, feesPending: true })).toBe(true)
  })

  it('reports loading while the native balance is still being read', function () {
    expect(computeIsLoading({ ...base, isNativeBalancePending: true })).toBe(
      true,
    )
  })

  it('reports loading while allowance is still resolving', function () {
    expect(computeIsLoading({ ...base, isAllowanceLoading: true })).toBe(true)
  })

  it('reports loading while balance has not loaded yet', function () {
    expect(computeIsLoading({ ...base, balanceLoaded: false })).toBe(true)
  })

  it('reports loading while preview is in flight but only when input is valid', function () {
    expect(computeIsLoading({ ...base, isPreviewLoading: true })).toBe(true)
    expect(
      computeIsLoading({
        ...base,
        isPreviewLoading: true,
        validInput: false,
      }),
    ).toBe(false)
  })

  it('reports not-loading on the happy path', function () {
    expect(computeIsLoading(base)).toBe(false)
  })
})

describe('resolveInsufficientFeesError', function () {
  const base = {
    insufficientFeesMessage: 'insufficient-eth',
    nativeBalance: BigInt(200),
    totalFees: BigInt(100),
  }

  it('returns undefined when the balance covers the fees', function () {
    expect(resolveInsufficientFeesError(base)).toBeUndefined()
  })

  it('returns undefined when the balance exactly covers the fees', function () {
    expect(
      resolveInsufficientFeesError({ ...base, nativeBalance: BigInt(100) }),
    ).toBeUndefined()
  })

  it('returns the message when the balance falls short', function () {
    expect(
      resolveInsufficientFeesError({ ...base, nativeBalance: BigInt(99) }),
    ).toBe('insufficient-eth')
  })

  it('does not block while the balance is unknown', function () {
    expect(
      resolveInsufficientFeesError({ ...base, nativeBalance: undefined }),
    ).toBeUndefined()
  })

  it('does not block while the fees are unknown', function () {
    expect(
      resolveInsufficientFeesError({
        ...base,
        nativeBalance: BigInt(0),
        totalFees: undefined,
      }),
    ).toBeUndefined()
  })
})

describe('resolveValidationError', function () {
  const base = {
    insufficientFeesError: undefined,
    previewIssueMessage: undefined,
    validationError: undefined,
  }

  it('returns the previewIssueMessage when set', function () {
    expect(
      resolveValidationError({
        ...base,
        insufficientFeesError: 'fees-msg',
        previewIssueMessage: 'preview-msg',
        validationError: 'validation-msg',
      }),
    ).toBe('preview-msg')
  })

  it('falls back to the validationError when previewIssueMessage is undefined', function () {
    expect(
      resolveValidationError({
        ...base,
        insufficientFeesError: 'fees-msg',
        validationError: 'validation-msg',
      }),
    ).toBe('validation-msg')
  })

  it('falls back to the insufficientFeesError last', function () {
    expect(
      resolveValidationError({ ...base, insufficientFeesError: 'fees-msg' }),
    ).toBe('fees-msg')
  })

  it('returns undefined when all are undefined', function () {
    expect(resolveValidationError(base)).toBeUndefined()
  })
})
