'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode } from 'react'

import { useClaimUnstake } from '../../../_hooks/useClaimUnstake'
import {
  isCooldownMature,
  isFinalizeInFlight,
  unstakeSettlement,
} from '../../../_utils'
import { useEarnCooldownRemaining } from '../../../pool/[shareAddress]/_hooks/useEarnCooldownRemaining'
import { type EarnTransaction } from '../../../types'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

const useMatureRemaining = function (transaction: EarnTransaction | undefined) {
  const claimableAt = transaction?.claimableAt ?? null
  return useEarnCooldownRemaining(
    claimableAt !== null ? BigInt(claimableAt) : undefined,
  )
}

export const ClaimFromVaultCta = function ({
  fallback = null,
  fullWidth = true,
  redirectOnSign = false,
  transaction,
}: {
  fallback?: ReactNode
  fullWidth?: boolean
  redirectOnSign?: boolean
  transaction: EarnTransaction
}) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const remainingSec = useMatureRemaining(transaction)

  const { isPending, mutate } = useClaimUnstake({
    on: redirectOnSign
      ? emitter =>
          emitter.on('user-signed-tx', () =>
            setTxDrawerQueryString(transaction.requestTxHash),
          )
      : undefined,
    transaction,
  })

  const own = unstakeSettlement(transaction.settlement)
  const pending = isPending || (!!own && !own.failed)
  const failed = own?.failed ?? false

  if (!isCooldownMature(transaction, remainingSec)) {
    return <>{fallback}</>
  }

  const onSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (pending) return
    mutate()
  }

  return (
    <form
      className={fullWidth ? 'flex w-full [&>button]:w-full' : 'flex'}
      onSubmit={onSubmit}
    >
      <SubmitWhenConnected
        submitButton={
          <Button disabled={pending} size="small">
            {pending
              ? t('claiming')
              : failed
                ? tCommon('try-again')
                : t('withdraw')}
          </Button>
        }
        submitButtonSize="small"
      />
    </form>
  )
}

export const ClaimFromVaultBanner = function ({
  transaction,
}: {
  transaction: EarnTransaction | undefined
}) {
  const t = useTranslations('hemi-earn.transactions.banner')
  const remainingSec = useMatureRemaining(transaction)

  if (
    !transaction ||
    !isCooldownMature(transaction, remainingSec) ||
    isFinalizeInFlight(transaction)
  ) {
    return null
  }
  return (
    <div className="px-4 py-6 md:px-6">
      <WarningBox
        heading={t('withdraw.heading')}
        subheading={t('withdraw.subheading')}
      />
    </div>
  )
}
