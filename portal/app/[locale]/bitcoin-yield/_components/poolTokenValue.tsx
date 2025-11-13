'use client'

import { useTranslations } from 'next-intl'
import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { usePoolAsset } from '../_hooks/usePoolAsset'
import { usePoolTokenValue } from '../_hooks/usePoolTokenValue'

import { CardInfo } from './cardInfo'
import poolTokenValueIcon from './icons/poolTokenValue.svg'

export const PoolTokenValue = function () {
  const asset = usePoolAsset().data
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...usePoolTokenValue()}
      formatValue={poolTokenValue =>
        `1 : ${formatNumber(formatUnits(poolTokenValue, asset.decimals))} ${
          asset.symbol
        }`
      }
      icon={poolTokenValueIcon}
      label={t('pool-token-value')}
    />
  )
}
