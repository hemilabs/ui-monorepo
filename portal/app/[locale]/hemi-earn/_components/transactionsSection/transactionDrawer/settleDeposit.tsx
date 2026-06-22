'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { isAddressEqual } from 'viem'

import { useClaimDeposit } from '../../../_hooks/useClaimDeposit'
import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useRecoverDeposit } from '../../../_hooks/useRecoverDeposit'
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

const SettleDepositForm = ({
  disabled,
  fullWidth,
  label,
  onSubmit,
}: {
  disabled: boolean
  fullWidth: boolean
  label: ReactNode
  onSubmit: (e: FormEvent) => void
}) => (
  <form
    className={fullWidth ? 'flex w-full [&>button]:w-full' : 'flex'}
    onSubmit={onSubmit}
  >
    <SubmitWhenConnected
      submitButton={
        <Button disabled={disabled} size="small">
          {label}
        </Button>
      }
      submitButtonSize="small"
    />
  </form>
)

export const ClaimDeposit = function ({
  asset,
  fullWidth = true,
  pool,
  redirectOnSign,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { isPending, mutate } = useClaimDeposit({
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
    <SettleDepositForm
      disabled={pending}
      fullWidth={fullWidth}
      label={
        pending
          ? t('claiming')
          : failed
            ? tCommon('try-again')
            : t('claim-share-tokens')
      }
      onSubmit={onSubmit}
    />
  )
}

export const RecoverDeposit = function ({
  asset,
  fullWidth = true,
  pool,
  redirectOnSign,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { isPending, mutate } = useRecoverDeposit({
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
    <SettleDepositForm
      disabled={pending}
      fullWidth={fullWidth}
      label={
        pending
          ? t('recovering')
          : failed
            ? tCommon('try-again')
            : t('recover-funds')
      }
      onSubmit={onSubmit}
    />
  )
}

// The table-row variant: resolves the pool/asset and renders the compact
// Claim/Recover CTA (or nothing) for a deposit row. Retry stays a View→drawer
// flow, so it isn't handled here.
export const DepositRowCta = function ({
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
      <ClaimDeposit
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
      <RecoverDeposit
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

// "Add {share token} to wallet" CTA, surfaced once a deposit is FINALIZED (the
// share OFT has landed). Shared by the live and historical deposit drawers so
// both match the tunnel-history affordance.
export const AddShareTokenToWallet = function ({ token }: { token: EvmToken }) {
  const tCommon = useTranslations('common')
  return (
    <AddTokenToWallet
      labels={{
        error: tCommon('add-token-to-wallet-error'),
        idle: tCommon('add-token-to-wallet-idle'),
        pending: tCommon('add-token-to-wallet-pending'),
        success: tCommon('add-token-to-wallet-success'),
      }}
      token={token}
    />
  )
}
