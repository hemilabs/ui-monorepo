'use client'

import { useTranslations } from 'next-intl'
import { useAccount } from 'wagmi'

import { useCooldownDuration } from '../../_hooks/useCooldownDuration'
import { useEarnPools } from '../../_hooks/useEarnPools'
import { useIsCooldownEligible } from '../../_hooks/useIsCooldownEligible'
import { findPoolByAsset } from '../../_utils'
import { useEarnCooldownRemaining } from '../../pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import { type EarnPool, type EarnTransaction } from '../../types'

import { StatusBadge } from './statusBadge'

const SECONDS_PER_DAY = 86_400
const SECONDS_PER_HOUR = 3_600
const SECONDS_PER_MINUTE = 60

function formatCooldownText(
  seconds: number,
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>,
) {
  if (seconds >= SECONDS_PER_DAY) {
    return t('status.cooldown-ready-in-days', {
      value: Math.floor(seconds / SECONDS_PER_DAY),
    })
  }
  if (seconds >= SECONDS_PER_HOUR) {
    return t('status.cooldown-ready-in-hours', {
      value: Math.floor(seconds / SECONDS_PER_HOUR),
    })
  }
  if (seconds >= SECONDS_PER_MINUTE) {
    return t('status.cooldown-ready-in-minutes', {
      value: Math.floor(seconds / SECONDS_PER_MINUTE),
    })
  }
  return t('status.cooldown-ready-soon')
}

const isCooldownPhase = (status: EarnTransaction['status']) =>
  status === 'PENDING' || status === 'FULFILLED'

function deriveCooldownText({
  cooldownDurationSec,
  hasClaimableAt,
  isCooldownEligible,
  remainingSec,
  status,
  t,
}: {
  cooldownDurationSec: number | undefined
  hasClaimableAt: boolean
  isCooldownEligible: boolean | undefined
  remainingSec: number | undefined
  status: EarnTransaction['status']
  t: ReturnType<typeof useTranslations<'hemi-earn.transactions'>>
}): string | undefined {
  if (isCooldownEligible !== true) return undefined
  if (!isCooldownPhase(status)) return undefined
  if (hasClaimableAt && remainingSec === 0) {
    return t('status.ready-to-claim')
  }
  const displaySec = hasClaimableAt ? remainingSec ?? 0 : cooldownDurationSec
  if (displaySec === undefined || displaySec <= 0) return undefined
  return formatCooldownText(displaySec, t)
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
