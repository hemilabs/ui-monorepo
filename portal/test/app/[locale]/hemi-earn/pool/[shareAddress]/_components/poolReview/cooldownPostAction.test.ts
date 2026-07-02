import {
  type CooldownInputs,
  deriveCooldownPostAction,
} from 'app/[locale]/hemi-earn/pool/[shareAddress]/_components/poolReview/cooldownPostAction'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { describe, expect, it } from 'vitest'

const t = ((key: string) => key) as unknown as CooldownInputs['t']

const gatedInputs = {
  cooldownDurationSec: undefined,
  cooldownRemainingSec: undefined,
  isCooldownEligible: undefined,
  t,
  unstakeMined: true,
}

describe('deriveCooldownPostAction', function () {
  it('returns a completed milestone for FINALIZED rows without consuming the cooldown reads', function () {
    expect(
      deriveCooldownPostAction({ ...gatedInputs, subgraphStatus: 'FINALIZED' }),
    ).toEqual({
      description: 'cooldown-ended',
      status: ProgressStatus.COMPLETED,
    })
  })

  it('returns undefined for RECOVERED rows without consuming the cooldown reads', function () {
    expect(
      deriveCooldownPostAction({ ...gatedInputs, subgraphStatus: 'RECOVERED' }),
    ).toBeUndefined()
  })

  it('returns undefined for CANCELLED rows without consuming the cooldown reads', function () {
    expect(
      deriveCooldownPostAction({ ...gatedInputs, subgraphStatus: 'CANCELLED' }),
    ).toBeUndefined()
  })

  it('hides the milestone when the account is not cooldown eligible', function () {
    expect(
      deriveCooldownPostAction({
        ...gatedInputs,
        isCooldownEligible: false,
        subgraphStatus: 'FINALIZED',
      }),
    ).toBeUndefined()
  })
})
