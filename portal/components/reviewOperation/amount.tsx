import { DisplayAmount } from 'components/displayAmount'
import { type ReactNode } from 'react'
import { Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatUnits } from 'viem'

type Props = {
  endAdornment?: ReactNode
  token: Token
  value: string
}

export const Amount = function ({ endAdornment, token, value }: Props) {
  const t = useTranslations('common')
  return (
    <div className="flex items-center justify-between text-sm font-medium">
      <span className="text-neutral-500">{t('total-amount')}</span>
      <div className="flex items-center gap-x-1 text-neutral-950">
        <DisplayAmount
          amount={formatUnits(BigInt(value), token?.decimals ?? 18)}
          token={token}
        />
        {endAdornment}
      </div>
    </div>
  )
}
