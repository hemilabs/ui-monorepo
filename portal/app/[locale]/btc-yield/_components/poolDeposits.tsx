'use client'

import { RenderFiatBalance } from 'components/fiatBalance'
import { useTranslations } from 'next-intl'

import { usePoolAsset } from '../_hooks/usePoolAsset'
import { usePoolDeposits } from '../_hooks/usePoolDeposits'

import { CardInfo } from './cardInfo'
import poolDepositIcon from './icons/poolDeposit.svg'

export const PoolDeposits = function () {
  const poolToken = usePoolAsset().data
  const { data: poolDeposits, isError, status } = usePoolDeposits()
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      data={poolDeposits}
      formatValue={value => (
        <div className="flex items-center">
          <span className="mr-1">$</span>
          <RenderFiatBalance
            balance={value}
            queryStatus={status}
            token={poolToken}
          />
        </div>
      )}
      icon={poolDepositIcon}
      isError={isError}
      label={t('pool-deposits')}
    />
  )
}
