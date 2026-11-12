import {
  type TermsStep,
  classifyAcceptanceFailure,
  isSmartContractAccount,
  isStartingRetry,
  resolveTermsStep,
  showsTermsStep,
} from 'app/[locale]/hemi-earn/_utils/termsGate'
import { type Hex } from 'viem'
import { describe, expect, it } from 'vitest'

const defaults = {
  acceptedVersion: 'mock-1',
  hasContractCode: false,
  termsVersion: 'mock-1',
}

describe('termsGate', function () {
  describe('isSmartContractAccount', function () {
    it.each([
      ['no code at all', undefined],
      ['an empty runtime', '0x'],
      ['an EIP-7702 designator', '0xef01007702cafe00000000000000000000000000'],
    ])('does not flag %s', function (_name, code) {
      expect(isSmartContractAccount(code as Hex | undefined)).toBe(false)
    })

    it('flags a deployed contract', function () {
      expect(isSmartContractAccount('0x6080604052' as Hex)).toBe(true)
    })
  })

  describe('resolveTermsStep', function () {
    it('lets a wallet through once it accepted the current version', function () {
      expect(resolveTermsStep(defaults)).toBe('accepted')
    })

    it('asks a wallet that never accepted to accept', function () {
      expect(resolveTermsStep({ ...defaults, acceptedVersion: null })).toBe(
        'first-acceptance',
      )
    })

    it('asks again when the accepted version is older', function () {
      expect(resolveTermsStep({ ...defaults, acceptedVersion: 'mock-0' })).toBe(
        're-acceptance',
      )
    })

    it.each([
      ['never accepted', null],
      ['accepted an older version', 'mock-0'],
    ])(
      'tells a contract account it cannot sign, having %s',
      function (_name, acceptedVersion) {
        expect(
          resolveTermsStep({
            ...defaults,
            acceptedVersion,
            hasContractCode: true,
          }),
        ).toBe('cannot-sign')
      },
    )

    it('still lets a contract account through if it is already accepted', function () {
      expect(resolveTermsStep({ ...defaults, hasContractCode: true })).toBe(
        'accepted',
      )
    })
  })

  describe('classifyAcceptanceFailure', function () {
    it.each([true, false])(
      'reports a 409 as changed terms, user rejection: %s',
      function (isUserRejection) {
        expect(
          classifyAcceptanceFailure({ isUserRejection, status: 409 }),
        ).toBe('terms-changed')
      },
    )

    it.each([401, 422])(
      'reports a %i as a signature the API turned down',
      function (status) {
        expect(
          classifyAcceptanceFailure({ isUserRejection: false, status }),
        ).toBe('invalid-signature')
      },
    )

    it('stays quiet only when the user dismissed the wallet', function () {
      expect(
        classifyAcceptanceFailure({
          isUserRejection: true,
          status: undefined,
        }),
      ).toBe('not-signed')
    })

    it('reports a signing failure that is not a rejection as unexpected', function () {
      expect(
        classifyAcceptanceFailure({
          isUserRejection: false,
          status: undefined,
        }),
      ).toBe('unexpected')
    })

    it.each([400, 413, 500])('reports a %i as unexpected', function (status) {
      expect(
        classifyAcceptanceFailure({ isUserRejection: false, status }),
      ).toBe('unexpected')
    })
  })

  describe('showsTermsStep', function () {
    it.each([
      ['never accepted', 'first-acceptance'],
      ['accepted an older version', 're-acceptance'],
      ['a wallet that cannot sign', 'cannot-sign'],
      ['a step that is not known yet', undefined],
    ])('stops a starting deposit on %s', function (_name, step) {
      expect(
        showsTermsStep({
          isStartingDeposit: true,
          step: step as TermsStep | undefined,
        }),
      ).toBe(true)
    })

    it('lets a starting deposit through once accepted', function () {
      expect(
        showsTermsStep({ isStartingDeposit: true, step: 'accepted' }),
      ).toBe(false)
    })

    it.each([
      ['accepted', 'accepted'],
      ['pending', undefined],
      ['first-acceptance', 'first-acceptance'],
    ])(
      'stays out of the way while no deposit starts, step %s',
      function (_name, step) {
        expect(
          showsTermsStep({
            isStartingDeposit: false,
            step: step as TermsStep | undefined,
          }),
        ).toBe(false)
      },
    )
  })

  describe('isStartingRetry', function () {
    const retrying = {
      canRetry: true,
      hasAskedForTerms: false,
      isTermsError: false,
    }

    it('waits for the user to press retry', function () {
      expect(isStartingRetry(retrying)).toBe(false)
    })

    it('starts once the user pressed retry', function () {
      expect(isStartingRetry({ ...retrying, hasAskedForTerms: true })).toBe(
        true,
      )
    })

    // The retry button is disabled while the terms are unknown, so without this
    // the failed read would never surface the generic error #2592 asks for.
    it('starts on a failed terms read, with no press', function () {
      expect(isStartingRetry({ ...retrying, isTermsError: true })).toBe(true)
    })

    it.each([
      ['the user pressed retry', { hasAskedForTerms: true }],
      ['the terms read failed', { isTermsError: true }],
    ])(
      'never starts on a row that cannot retry, even if %s',
      function (_name, extra) {
        expect(
          isStartingRetry({ ...retrying, ...extra, canRetry: false }),
        ).toBe(false)
      },
    )
  })
})
