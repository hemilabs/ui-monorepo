'use client'

import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useTranslations } from 'next-intl'

import { usePoolTokenValue } from '../_hooks/usePoolTokenValue'

import { CardInfo } from './cardInfo'
import poolTokenValueIcon from './icons/poolTokenValue.svg'

export const PoolTokenValue = function () {
  const hemiBtc = useHemiBtcToken()
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...usePoolTokenValue()}
      formatValue={poolTokenValue => `1 : ${poolTokenValue} ${hemiBtc.symbol}`}
      icon={poolTokenValueIcon}
      label={t('pool-token-value')}
    />
  )
}
