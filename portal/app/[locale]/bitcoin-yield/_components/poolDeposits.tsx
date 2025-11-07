'use client'

import { useTranslations } from 'next-intl'
import { formatTVL } from 'utils/format'

import { usePoolDeposits } from '../_hooks/usePoolDeposits'

import { CardInfo } from './cardInfo'
import poolDepositIcon from './icons/poolDeposit.svg'

export const PoolDeposits = function () {
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...usePoolDeposits()}
      formatValue={value => formatTVL(value.toString())}
      icon={poolDepositIcon}
      label={t('pool-deposits')}
    />
  )
}
