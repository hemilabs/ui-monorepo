import { useNetworkType } from 'hooks/useNetworkType'
import { useTvl } from 'hooks/useTvl'
import { useTranslations } from 'next-intl'
import React, { type ReactNode, Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'

import { DollarSign } from './dollarSign'

const Text = ({ children }: { children: ReactNode }) => (
  <h2 className="text-white">{children}</h2>
)

const TvlImpl = function () {
  const { data, isError } = useTvl()
  const t = useTranslations('navbar')
  const [networkType] = useNetworkType()
  const isNotTestnet = networkType !== 'testnet'

  const renderAmount = function () {
    if (isError) {
      return <Text>{'-'}</Text>
    }

    if (data === undefined) {
      return (
        <Skeleton
          baseColor="rgba(255,255,255,0.08)"
          highlightColor="rgba(255,255,255,0.4)"
        />
      )
    }

    return (
      <Text>{`$${new Intl.NumberFormat('en', {
        compactDisplay: 'short',
        notation: 'compact',
      }).format(data)}`}</Text>
    )
  }

  return (
    isNotTestnet && (
      <section
        className="h-22 relative mx-0.5 mb-4 flex flex-col gap-y-3 rounded-lg bg-neutral-800 
        p-4 md:mb-0 md:mt-2.5"
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
      <Skeleton className="h-22 mb-4 w-full rounded-lg md:mb-0 md:mt-4" />
    }
  >
    <TvlImpl />
  </Suspense>
)
