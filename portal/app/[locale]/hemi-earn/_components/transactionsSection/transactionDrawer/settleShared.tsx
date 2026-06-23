'use client'

import { AddTokenToWallet } from 'components/addTokenToWallet'
import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode } from 'react'
import { type EvmToken } from 'types/token'

// The compact settle button shared by every claim/recover CTA (deposit + redeem).
// Drawer CTAs stretch full-width; the table cell renders a compact button.
export const SettleForm = ({
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
