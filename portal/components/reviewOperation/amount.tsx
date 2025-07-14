'use client'

import { DisplayAmount } from 'components/displayAmount'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { formatUnits } from 'viem'

type Props = {
  symbolRenderer?: (token: Token) => string
  token?: Token
  value: string
}

export const Amount = function ({ symbolRenderer, token, value }: Props) {
  const t = useTranslations('common')
  return (
    <div className="flex items-center justify-between text-sm font-medium">
      <span className="text-neutral-500">{t('total-amount')}</span>
      <div className="text-neutral-950">
        <DisplayAmount
          amount={formatUnits(BigInt(value), token?.decimals ?? 18)}
          symbolRenderer={symbolRenderer}
          token={token}
        />
      </div>
    </div>
  )
}
