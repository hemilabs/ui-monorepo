import { useNetworkType } from 'hooks/useNetworkType'
import { useTvl } from 'hooks/useTvl'
import { useTranslations } from 'next-intl'
import React, { Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'

import { DollarSign } from './dollarSign'

const TvlImpl = function () {
  const { data, isError } = useTvl()
  const t = useTranslations('navbar')
  const [networkType] = useNetworkType()
  const isNotTestnet = networkType !== 'testnet'

  const renderAmount = function () {
    if (isError) {
      return '-'
    }

    if (data === undefined) {
      return <Skeleton baseColor="#FFF" highlightColor="#009CF5" />
    }

    return (
      <h6 className="text-2xl font-semibold text-white">{`$${new Intl.NumberFormat(
        'en',
        {
          compactDisplay: 'short',
          notation: 'compact',
        },
      ).format(data)}`}</h6>
    )
  }

  return (
    isNotTestnet && (
      <section
        className="shadow-soft h-22 bg-sky-450 relative mx-0.5 mb-4 flex flex-col gap-y-3 rounded-lg 
        p-4 md:mb-0 md:mt-3"
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-medium text-white">{t('tvl')}:</span>
          <DollarSign />
        </div>
        {renderAmount()}
      </section>
    )
  )
}

export const Tvl = () => (
  <Suspense
    fallback={
      // Statically render a skeleton as TVL is only shown and mainnet, but in addition to this,
      // the position changes on the navbar.
      <Skeleton className="h-22 shadow-soft mb-4 w-full rounded-lg md:mb-0 md:mt-4" />
    }
  >
    <TvlImpl />
  </Suspense>
)
