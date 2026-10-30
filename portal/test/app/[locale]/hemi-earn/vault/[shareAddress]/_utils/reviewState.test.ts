import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { describe, expect, it } from 'vitest'

import {
  isOperationInFlight,
  resolveMayNeedApproval,
  showsReview,
  unsignedStepStatus,
} from '../../../../../../../app/[locale]/hemi-earn/vault/[shareAddress]/_utils/reviewState'

describe('reviewState', function () {
  describe('showsReview', function () {
    it('shows the review before anything is signed', function () {
      expect(showsReview({ canRetry: false, hasSigned: false })).toBe(true)
    })

    it('shows the review again when a signed attempt can be retried', function () {
      expect(showsReview({ canRetry: true, hasSigned: true })).toBe(true)
    })

    it('hides the review while a signed attempt is in flight', function () {
      expect(showsReview({ canRetry: false, hasSigned: true })).toBe(false)
    })
  })

  describe('resolveMayNeedApproval', function () {
    it('treats a loading allowance as possibly needing approval', function () {
      expect(
        resolveMayNeedApproval({
          isAllowanceError: false,
          isAllowanceLoading: true,
          needsApproval: false,
        }),
      ).toBe(true)
    })

    it('treats an errored allowance as possibly needing approval', function () {
      expect(
        resolveMayNeedApproval({
          isAllowanceError: true,
          isAllowanceLoading: false,
          needsApproval: false,
        }),
      ).toBe(true)
    })

    it('is false only once the allowance resolved as sufficient', function () {
      expect(
        resolveMayNeedApproval({
          isAllowanceError: false,
          isAllowanceLoading: false,
          needsApproval: false,
        }),
      ).toBe(false)
    })
  })

  describe('isOperationInFlight', function () {
    const inFlightStatuses = ['approving', 'signing'] as const

    it('is in flight while the signed operation is still mining', function () {
      expect(isOperationInFlight({ inFlightStatuses, status: 'signing' })).toBe(
        true,
      )
    })

    it('is done once the operation reached a resting status', function () {
      expect(isOperationInFlight({ inFlightStatuses, status: 'done' })).toBe(
        false,
      )
    })

    it('is not in flight when there is no operation at all', function () {
      expect(isOperationInFlight({ inFlightStatuses, status: undefined })).toBe(
        false,
      )
    })
  })

  describe('unsignedStepStatus', function () {
    it('holds the operation step back while an approval is still needed', function () {
      expect(unsignedStepStatus(true)).toBe(ProgressStatus.NOT_READY)
    })

    it('marks the operation step ready once no approval is needed', function () {
      expect(unsignedStepStatus(false)).toBe(ProgressStatus.READY)
    })
  })
})
