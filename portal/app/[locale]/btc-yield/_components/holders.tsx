import { useTranslations } from 'next-intl'
import { formatNumber } from 'utils/format'

import { useHolders } from '../_hooks/useHolders'

import { CardInfo } from './cardInfo'
import holdersIcon from './icons/holders.svg'

export const Holders = function () {
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      {...useHolders()}
      formatValue={holders => formatNumber(holders)}
      icon={holdersIcon}
      label={t('holders')}
    />
  )
}
