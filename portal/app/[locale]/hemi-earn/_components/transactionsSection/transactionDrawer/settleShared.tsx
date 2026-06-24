'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import {
  claimDeposit,
  claimRedeem,
  recoverDeposit,
  recoverRedeem,
} from 'hemi-earn-actions/actions'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode } from 'react'
import { type EvmToken } from 'types/token'
import { isAddressEqual } from 'viem'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { useSettle } from '../../../_hooks/useSettle'
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

// The compact settle button shared by every claim/recover CTA (deposit + redeem).
// Drawer CTAs stretch full-width; the table cell renders a compact button.
const SettleForm = ({
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

type SettleOperation = 'CLAIM' | 'RECOVER'

// One table for the whole (kind, operation) matrix so the Router action and the
// idle label stay in lockstep and can't get mismatched across call sites.
const SETTLE_CONFIG = {
  DEPOSIT: {
    CLAIM: { action: claimDeposit, label: 'claim-share-tokens' },
    RECOVER: { action: recoverDeposit, label: 'recover-funds' },
  },
  REDEEM: {
    CLAIM: { action: claimRedeem, label: 'claim-funds' },
    RECOVER: { action: recoverRedeem, label: 'recover-shares' },
  },
} as const

type SettleCtaProps = {
  asset: EarnAsset
  // Drawer CTAs stretch full-width; the table cell renders a compact button.
  fullWidth?: boolean
  operation: SettleOperation
  pool: EarnPool
  // When rendered in the table the drawer isn't open yet, so opening it on
  // signing lets the user watch the settlement mine. In the drawer it's already
  // open, so the redirect is skipped.
  redirectOnSign?: boolean
  transaction: EarnTransaction
}

// The claim/recover CTA for one request — a single component covering both kinds
// and both operations. The delivered-token inversion lives here in one place: a
// deposit claim / redeem recover deliver shares; a deposit recover / redeem claim
// deliver the underlying asset (same rule as `useEarnDeliveryWatcher`).
export const SettleCta = function ({
  asset,
  fullWidth = true,
  operation,
  pool,
  redirectOnSign,
  transaction,
}: SettleCtaProps) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { action, label } = SETTLE_CONFIG[transaction.kind][operation]
  const deliversShares =
    (transaction.kind === 'DEPOSIT') === (operation === 'CLAIM')

  const { isPending, mutate } = useSettle({
    action,
    deliveredTokenAddress: deliversShares ? pool.shareAddress : asset.address,
    kind: operation,
    on: redirectOnSign
      ? emitter =>
          emitter.on('user-signed-tx', () =>
            setTxDrawerQueryString(transaction.requestTxHash),
          )
      : undefined,
    transaction,
  })

  const { settlement } = transaction
  const own = settlement?.kind === operation ? settlement : undefined
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
          ? t(operation === 'CLAIM' ? 'claiming' : 'recovering')
          : failed
            ? tCommon('try-again')
            : t(label)
      }
      onSubmit={onSubmit}
    />
  )
}

// The table-row variant: resolves the pool/asset and renders the compact
// Claim/Recover CTA (or nothing). Retry stays a View→drawer flow, so it isn't
// handled here.
export const SettleRowCta = function ({
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
      <SettleCta
        asset={asset}
        fullWidth={false}
        operation="CLAIM"
        pool={pool}
        redirectOnSign
        transaction={transaction}
      />
    )
  }
  if (needsRecover(transaction)) {
    return (
      <SettleCta
        asset={asset}
        fullWidth={false}
        operation="RECOVER"
        pool={pool}
        redirectOnSign
        transaction={transaction}
      />
    )
  }
  return null
}

// "Add {token} to wallet" CTA surfaced once a request is FINALIZED (the delivered
// token has landed): the share OFT for a deposit, the underlying asset for a
// redeem. Shared by the live and historical drawers so both match the tunnel
// history affordance.
export const AddTokenToWalletCta = function ({ token }: { token: EvmToken }) {
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
