import {
  classifyAcceptanceFailure,
  isSmartContractAccount,
  resolveTermsStep,
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
      'reports a 409 as changed terms, having signed: %s',
      function (hasSignature) {
        expect(classifyAcceptanceFailure({ hasSignature, status: 409 })).toBe(
          'terms-changed',
        )
      },
    )

    it.each([401, 422])(
      'reports a %i as a signature the API turned down',
      function (status) {
        expect(classifyAcceptanceFailure({ hasSignature: true, status })).toBe(
          'invalid-signature',
        )
      },
    )

    it('reports a failure before any signature as not signed', function () {
      expect(
        classifyAcceptanceFailure({ hasSignature: false, status: undefined }),
      ).toBe('not-signed')
    })

    it('reports a transport failure after signing as unexpected, so the signature is reused', function () {
      expect(
        classifyAcceptanceFailure({ hasSignature: true, status: undefined }),
      ).toBe('unexpected')
    })

    it.each([400, 413, 500])('reports a %i as unexpected', function (status) {
      expect(classifyAcceptanceFailure({ hasSignature: true, status })).toBe(
        'unexpected',
      )
    })
  })
})
