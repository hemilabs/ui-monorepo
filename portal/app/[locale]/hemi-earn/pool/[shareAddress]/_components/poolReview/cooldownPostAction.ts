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

const RECOVER_PATH_STATUSES = new Set<string | undefined>([
  'CANCELLED',
  'RECOVERED',
])

// The cooldown clock sub-step under Unstake. Like the tunnel's wait-step, it stays mounted
// across its whole lifecycle so the milestone stays visible after the wait elapses; hidden only
// when there's no cooldown (whitelist / disabled).
export function deriveCooldownPostAction({
  cooldownDurationSec,
  cooldownRemainingSec,
  isCooldownEligible,
  subgraphStatus,
  t,
  unstakeMined,
}: CooldownInputs): CooldownPostAction | undefined {
  if (isCooldownEligible === false) return undefined
  // Recover path: cooldown was bypassed, shares come straight back — no milestone here (the recover step carries the state).
  if (RECOVER_PATH_STATUSES.has(subgraphStatus)) {
    return undefined
  }
  // Cooldown is over once the timer elapses or the row reaches FULFILLED/FINALIZED (both imply
  // it matured — authoritative over a stale claimableAt). Keep it as a COMPLETED milestone so an
  // auto-claim landing right after zero doesn't make the sub-step vanish.
  const cooldownOver =
    cooldownRemainingSec === 0 ||
    subgraphStatus === 'FULFILLED' ||
    subgraphStatus === 'FINALIZED'
  if (cooldownOver) {
    return {
      description: t('cooldown-ended'),
      status: ProgressStatus.COMPLETED,
    }
  }
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

  // Under an hour: show "less than an hour" — a precise countdown would lie given the minute-resolution tick.
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
