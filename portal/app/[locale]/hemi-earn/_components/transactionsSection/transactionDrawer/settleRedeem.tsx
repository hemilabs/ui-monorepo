'use client'

import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode } from 'react'
import { isAddressEqual } from 'viem'

import { useClaimRedeem } from '../../../_hooks/useClaimRedeem'
import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useRecoverRedeem } from '../../../_hooks/useRecoverRedeem'
import {
  findPoolByAsset,
  needsManualClaim,
  needsRecover,
} from '../../../_utils'
import {
  type EarnAsset,
  type EarnPool,
  type EarnTransaction,
} from '../../../types'

import { SettleForm } from './settleShared'
import { useTxDrawerQueryString } from './useTxDrawerQueryString'

type Props = {
  asset: EarnAsset
  // Drawer CTAs stretch full-width; the table cell renders a compact button.
  fullWidth?: boolean
  pool: EarnPool
  // When rendered in the table the drawer isn't open yet, so opening it on
  // signing lets the user watch the settlement mine. In the drawer it's already
  // open, so the redirect is skipped.
  redirectOnSign?: boolean
  transaction: EarnTransaction
}

export const ClaimRedeem = function ({
  asset,
  fullWidth = true,
  pool,
  redirectOnSign,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { isPending, mutate } = useClaimRedeem({
    asset,
    on: redirectOnSign
      ? emitter =>
          emitter.on('user-signed-tx', () =>
            setTxDrawerQueryString(transaction.requestTxHash),
          )
      : undefined,
    pool,
    transaction,
  })

  const { settlement } = transaction
  const own = settlement?.kind === 'CLAIM' ? settlement : undefined
  const pending = isPending || (!!own && !own.failed)
  const failed = own?.failed ?? false

  const onSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (pending) return
    mutate()
  }

  return (
    <SettleForm
      disabled={pending}
      fullWidth={fullWidth}
      label={
        pending
          ? t('claiming')
          : failed
            ? tCommon('try-again')
            : t('claim-funds')
      }
      onSubmit={onSubmit}
    />
  )
}

export const RecoverRedeem = function ({
  asset,
  fullWidth = true,
  pool,
  redirectOnSign,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { isPending, mutate } = useRecoverRedeem({
    asset,
    on: redirectOnSign
      ? emitter =>
          emitter.on('user-signed-tx', () =>
            setTxDrawerQueryString(transaction.requestTxHash),
          )
      : undefined,
    pool,
    transaction,
  })

  const { settlement } = transaction
  const own = settlement?.kind === 'RECOVER' ? settlement : undefined
  const pending = isPending || (!!own && !own.failed)
  const failed = own?.failed ?? false

  const onSubmit = function (e: FormEvent) {
    e.preventDefault()
    if (pending) return
    mutate()
  }

  return (
    <SettleForm
      disabled={pending}
      fullWidth={fullWidth}
      label={
        pending
          ? t('recovering')
          : failed
            ? tCommon('try-again')
            : t('recover-shares')
      }
      onSubmit={onSubmit}
    />
  )
}

// The table-row variant: resolves the pool/asset and renders the compact
// Claim/Recover CTA (or nothing) for a redeem row. Retry stays a View→drawer
// flow, so it isn't handled here.
export const RedeemRowCta = function ({
  fallback,
  transaction,
}: {
  // Rendered when the pool/asset can't be resolved yet (pools still loading) or
  // for a delisted asset — keeps the row's View affordance instead of an empty
  // cell.
  fallback?: ReactNode
  transaction: EarnTransaction
}) {
  const { data: pools = [] } = useEarnPools()
  const pool = findPoolByAsset(pools, transaction.asset)
  const asset = pool?.assets.find(a =>
    isAddressEqual(a.address, transaction.asset),
  )

  if (!pool || !asset) {
    return fallback ?? null
  }
  if (needsManualClaim(transaction)) {
    return (
      <ClaimRedeem
        asset={asset}
        fullWidth={false}
        pool={pool}
        redirectOnSign
        transaction={transaction}
      />
    )
  }
  if (needsRecover(transaction)) {
    return (
      <RecoverRedeem
        asset={asset}
        fullWidth={false}
        pool={pool}
        redirectOnSign
        transaction={transaction}
      />
    )
  }
  return null
}
