'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { WarningBox } from 'components/warningBox'
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
  pickSettleBannerKey,
} from '../../../_utils'
import {
  type EarnAsset,
  type EarnPool,
  type EarnTransaction,
} from '../../../types'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

// Shared settle button for every claim/recover CTA; full-width in drawers, compact in the table cell.
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

// (kind, operation) matrix so the Router action and its label stay in lockstep across call sites.
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
  fullWidth?: boolean
  operation: SettleOperation
  pool: EarnPool
  // In the table the drawer isn't open yet, so sign opens it to watch the settlement mine; skipped in the drawer.
  redirectOnSign?: boolean
  transaction: EarnTransaction
}

// Claim/recover CTA covering both kinds/operations. Delivered-token inversion lives here:
// deposit claim / redeem recover deliver shares; the other two deliver the asset.
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

// Table-row variant: resolves the pool/asset and renders the compact Claim/Recover CTA (retry stays a View→drawer flow).
export const SettleRowCta = function ({
  fallback,
  transaction,
}: {
  // Shown when the pool/asset can't resolve (still loading or delisted) — keeps the View affordance.
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

// Explains the manual Claim/Recover CTA (self-gates via pickSettleBannerKey).
// Own translation namespace so it's reusable across drawers under different roots.
export const SettleBanner = function ({
  transaction,
}: {
  transaction: EarnTransaction | undefined
}) {
  const t = useTranslations('hemi-earn.transactions.banner')
  const key = pickSettleBannerKey(transaction)
  if (!key) return null
  // Padding matches the drawer's 24px gutter (16px on mobile).
  return (
    <div className="px-4 py-6 md:px-6">
      <WarningBox
        heading={t(`${key}.heading`)}
        subheading={t(`${key}.subheading`)}
      />
    </div>
  )
}

// "Add to wallet" CTA offered once FINALIZED, when the delivered token has landed.
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
