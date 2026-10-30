import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { describe, expect, it, vi } from 'vitest'

import { inTransitPostAction } from '../../../../../app/[locale]/hemi-earn/_utils/inTransit'

const t = vi.fn((key, values) => `${key}:${values.duration}`)

describe('inTransitPostAction', function () {
  it('describes the wait while the transfer is crossing', function () {
    expect(
      inTransitPostAction({ duration: '5 minutes', isCrossing: true, t }),
    ).toEqual({
      description: 'in-transit:5 minutes',
      status: ProgressStatus.NOT_READY,
    })
  })

  it('stays out of the ladder when nothing is crossing', function () {
    expect(
      inTransitPostAction({ duration: '5 minutes', isCrossing: false, t }),
    ).toBeUndefined()
  })

  it('says nothing rather than a blank duration when the vault is unknown', function () {
    expect(
      inTransitPostAction({ duration: undefined, isCrossing: true, t }),
    ).toBeUndefined()
  })
})
