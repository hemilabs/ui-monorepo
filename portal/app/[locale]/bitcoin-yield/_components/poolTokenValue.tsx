'use client'

import { useHemiBtcToken } from 'hooks/useHemiBtcToken'
import { useTranslations } from 'next-intl'
import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { usePoolTokenValue } from '../_hooks/usePoolTokenValue'

import { CardInfo } from './cardInfo'
import poolTokenValueIcon from './icons/poolTokenValue.svg'

export const PoolTokenValue = function () {
  const hemiBtc = useHemiBtcToken()
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...usePoolTokenValue()}
      formatValue={poolTokenValue =>
        `1 : ${formatNumber(formatUnits(poolTokenValue, hemiBtc.decimals))} ${
          hemiBtc.symbol
        }`
      }
      icon={poolTokenValueIcon}
      label={t('pool-token-value')}
    />
  )
}
