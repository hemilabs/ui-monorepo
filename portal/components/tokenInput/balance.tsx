import { Balance } from 'components/cryptoBalance'
import { ComponentType, ReactNode } from 'react'
import { Token } from 'types/token'
import { useTranslations } from 'use-intl'

type Props<T extends Token> = {
  balanceComponent?: ComponentType<{
    token: T
  }>
  label?: string
  maxButton?: ReactNode
  token: T
}

export const TokenInputBalance = function <T extends Token>({
  balanceComponent,
  label,
  maxButton,
  token,
}: Props<T>) {
  const t = useTranslations('common')
  const BalanceComponent = balanceComponent ?? Balance
  return (
    <div className="flex items-center justify-end gap-x-2 whitespace-nowrap">
      <span className="text-neutral-500">{label ?? t('balance')}:</span>
      <span className="text-neutral-950">
        <BalanceComponent token={token} />
      </span>
      {maxButton}
    </div>
  )
}
