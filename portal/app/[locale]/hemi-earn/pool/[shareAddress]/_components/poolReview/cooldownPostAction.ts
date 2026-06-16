import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { secondsToDays, secondsToHours, secondsToWholeDays } from 'utils/time'

export type CooldownPostAction = {
  description: ReactNode
  status: ProgressStatusType
}

export type CooldownInputs = {
  cooldownDurationSec: number | undefined
  cooldownRemainingSec: number | undefined
  isCooldownEligible: boolean | undefined
  subgraphStatus: string | undefined
  t: ReturnType<typeof useTranslations<'hemi-earn.pool.drawer'>>
  unstakeMined: boolean
}

// Decides what (if anything) to render under the Unstake step as a clock
// sub-step. Pure function so the component's complexity stays low.
//
// Mirrors the tunnel's wait-step pattern (e.g. `reviewEvmWithdrawal`):
// the sub-step stays mounted across its whole lifecycle (NOT_READY →
// PROGRESS → COMPLETED) so the user keeps a visible milestone even
// after the wait period elapses. The only case we hide it entirely is
// when the user simply doesn't have a cooldown (whitelist / disabled).
export function deriveCooldownPostAction({
  cooldownDurationSec,
  cooldownRemainingSec,
  isCooldownEligible,
  subgraphStatus,
  t,
  unstakeMined,
}: CooldownInputs): CooldownPostAction | undefined {
  if (isCooldownEligible === false) return undefined
  // The cooldown is effectively over once any of:
  //   - the local timer elapsed
  //   - the subgraph row reached FINALIZED (auto-claim fired the moment
  //     the cooldown matured)
  //   - the subgraph row reached RECOVERED (cancel/recovery ended the
  //     cooldown early)
  // Keep the sub-step visible as a COMPLETED milestone — without this,
  // an auto-claim landing seconds after the timer hits zero would make
  // the sub-step disappear right when the user expects to see it tick
  // over to "done".
  const cooldownOver =
    cooldownRemainingSec === 0 ||
    subgraphStatus === 'FINALIZED' ||
    subgraphStatus === 'RECOVERED'
  if (cooldownOver) {
    return {
      description: t('cooldown-ended'),
      status: ProgressStatus.COMPLETED,
    }
  }
  // Duration still loading — render nothing for now; the postAction
  // shows up once the on-chain read settles.
  if (cooldownDurationSec === undefined) return undefined

  const days = secondsToWholeDays(cooldownDurationSec)

  if (!unstakeMined) {
    return {
      description: t('wait-cooldown-pending', { days }),
      status: ProgressStatus.NOT_READY,
    }
  }

  if (cooldownRemainingSec === undefined) {
    return {
      description: t('wait-cooldown-pending', { days }),
      status: ProgressStatus.PROGRESS,
    }
  }

  // Sub-hour remaining: avoid the misleading "0h" by collapsing to a
  // generic "less than an hour" copy. Tick interval is at minute
  // resolution, so showing a precise minute countdown would lie about
  // freshness; the shorter copy is honest about where we are.
  if (cooldownRemainingSec < 3600) {
    return {
      description: t('wait-cooldown-countdown-soon'),
      status: ProgressStatus.PROGRESS,
    }
  }

  const remainingDays = Math.floor(secondsToDays(cooldownRemainingSec))
  const remainingHours = Math.floor(
    secondsToHours(cooldownRemainingSec - remainingDays * 86400),
  )
  return {
    description: t('wait-cooldown-countdown', {
      days: remainingDays,
      hours: remainingHours,
    }),
    status: ProgressStatus.PROGRESS,
  }
}
