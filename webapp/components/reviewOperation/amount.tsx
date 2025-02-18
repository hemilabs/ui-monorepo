'use client'

import { useTranslations } from 'next-intl'
import { type Token } from 'token-list'
import { getFormattedValue } from 'utils/format'
import { formatUnits } from 'viem'

type Props = {
  token?: Token
  value: string
}

export const Amount = function ({ token, value }: Props) {
  const t = useTranslations('common')
  return (
    <div className="flex items-center justify-between text-sm font-medium">
      <span className="text-neutral-500">{t('total-amount')}</span>
      <span className="text-neutral-950">
        {`${getFormattedValue(
          formatUnits(BigInt(value), token?.decimals ?? 18),
        )} ${token?.symbol ?? ''}`}
      </span>
    </div>
  )
}
