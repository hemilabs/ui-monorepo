'use client'

import { RenderFiatBalance } from 'components/fiatBalance'
import { useTranslations } from 'next-intl'

import { usePoolAsset } from '../_hooks/usePoolAsset'
import { usePoolDeposits } from '../_hooks/usePoolDeposits'

import { CardInfo } from './cardInfo'
import poolDepositIcon from './icons/poolDeposit.svg'

export const PoolDeposits = function () {
  const poolToken = usePoolAsset().data
  const { data: poolDeposits, isError } = usePoolDeposits()
  const t = useTranslations('bitcoin-yield.info')

  return (
    <CardInfo
      data={poolDeposits}
      formatValue={value => (
        <>
          <span className="mr-1">$</span>
          <RenderFiatBalance
            balance={value}
            // at the point this component is rendered, the data is already available
            fetchStatus="idle"
            queryStatus="success"
            token={poolToken}
          />
        </>
      )}
      icon={poolDepositIcon}
      isError={isError}
      label={t('pool-deposits')}
    />
  )
}
