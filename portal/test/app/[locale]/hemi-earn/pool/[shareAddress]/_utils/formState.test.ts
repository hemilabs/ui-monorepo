import { describe, expect, it } from 'vitest'

import {
  computeIsLoading,
  resolveErrorKey,
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

describe('computeIsLoading', function () {
  const base = {
    balanceLoaded: true,
    isAllowanceLoading: false,
    isPreviewLoading: false,
    validInput: true,
  }

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

describe('resolveValidationError', function () {
  it('returns the previewIssueMessage when set', function () {
    expect(resolveValidationError('preview-msg', 'validation-msg')).toBe(
      'preview-msg',
    )
  })

  it('falls back to the validationError when previewIssueMessage is undefined', function () {
    expect(resolveValidationError(undefined, 'validation-msg')).toBe(
      'validation-msg',
    )
  })

  it('returns undefined when both are undefined', function () {
    expect(resolveValidationError(undefined, undefined)).toBeUndefined()
  })
})
