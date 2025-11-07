import { useTranslations } from 'next-intl'

import { useEarningRate } from '../_hooks/useEarningRate'

import { CardInfo } from './cardInfo'
import earningRateIcon from './icons/earningRate.svg'

export const EarningRate = function () {
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...useEarningRate()}
      formatValue={earningRate => `${earningRate}%`}
      icon={earningRateIcon}
      label={t('earning-rate')}
    />
  )
}
