'use client'

import { useTranslations } from 'use-intl'
import {
  secondsPerDay,
  secondsPerHour,
  secondsToDaysAndHours,
  secondsToWholeDays,
} from 'utils/time'
import { useAccount } from 'wagmi'

import { useCooldownDuration } from '../../_hooks/useCooldownDuration'
import { useEarnPools } from '../../_hooks/useEarnPools'
import { useIsCooldownEligible } from '../../_hooks/useIsCooldownEligible'
import { findPoolByAsset } from '../../_utils/pools'
import { useEarnCooldownRemaining } from '../../pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import { type EarnPool, type EarnTransaction } from '../../types'

import { StatusBadge } from './statusBadge'

function formatCooldownText(
  seconds: number,
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>,
) {
  if (seconds >= secondsPerDay) {
    const { days, hours } = secondsToDaysAndHours(seconds)
    return t('status.cooldown-ready-in-days-hours', { days, hours })
  }
  if (seconds >= secondsPerHour) {
    return t('status.cooldown-ready-in-hours', {
      value: Math.floor(seconds / secondsPerHour),
    })
  }
  return t('status.cooldown-ready-in-under-hour')
}

const isCooldownPhase = (status: EarnTransaction['status']) =>
  status === 'PENDING' || status === 'FULFILLED'

function postCooldownText({
  hasClaimableAt,
  processedAt,
  remainingSec,
  status,
  t,
}: {
  hasClaimableAt: boolean
  processedAt: string | null | undefined
  remainingSec: number | undefined
  status: EarnTransaction['status']
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>
}) {
  if (status === 'PENDING' && processedAt) {
    return t('status.bridging-back')
  }

  if (status === 'FULFILLED') {
    return t('status.ready-to-claim')
  }

  if (hasClaimableAt && remainingSec === 0) {
    return t('status.ready-to-withdraw')
  }
  return undefined
}

function deriveCooldownText({
  cooldownDurationSec,
  hasClaimableAt,
  isCooldownEligible,
  processedAt,
  remainingSec,
  status,
  t,
}: {
  cooldownDurationSec: number | undefined
  hasClaimableAt: boolean
  isCooldownEligible: boolean | undefined
  processedAt: string | null | undefined
  remainingSec: number | undefined
  status: EarnTransaction['status']
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>
}): string | undefined {
  if (isCooldownEligible !== true) return undefined
  if (!isCooldownPhase(status)) return undefined
  const postCooldown = postCooldownText({
    hasClaimableAt,
    processedAt,
    remainingSec,
    status,
    t,
  })
  if (postCooldown !== undefined) return postCooldown
  if (!hasClaimableAt) {
    if (cooldownDurationSec === undefined || cooldownDurationSec <= 0) {
      return undefined
    }
    return t('status.cooldown-ready-in-days', {
      value: secondsToWholeDays(cooldownDurationSec),
    })
  }
  const remaining = remainingSec ?? 0
  if (remaining <= 0) return undefined
  return formatCooldownText(remaining, t)
}

type Props = { transaction: EarnTransaction }
type ResolvedProps = Props & { pool: EarnPool }

const WithdrawStatusCellResolved = function ({
  pool,
  transaction,
}: ResolvedProps) {
  const t = useTranslations('hemi-earn.transactions')
  const { address } = useAccount()

  const { data: isCooldownEligible } = useIsCooldownEligible({
    account: address,
    stakingVault: pool.stakingVault,
  })

  const { data: cooldownDurationSec } = useCooldownDuration({
    stakingVault: pool.stakingVault,
  })

  const claimableAt = transaction.claimableAt ?? null
  const remainingSec = useEarnCooldownRemaining(
    claimableAt !== null ? BigInt(claimableAt) : undefined,
  )

  const cooldownText = deriveCooldownText({
    cooldownDurationSec,
    hasClaimableAt: claimableAt !== null,
    isCooldownEligible,
    processedAt: transaction.processedAt,
    remainingSec,
    status: transaction.status,
    t,
  })

  return <StatusBadge cooldownText={cooldownText} transaction={transaction} />
}

export const WithdrawStatusCell = function ({ transaction }: Props) {
  const { data: pools = [] } = useEarnPools()
  const pool = findPoolByAsset(pools, transaction.asset)
  if (!pool) {
    return <StatusBadge transaction={transaction} />
  }
  return <WithdrawStatusCellResolved pool={pool} transaction={transaction} />
}
