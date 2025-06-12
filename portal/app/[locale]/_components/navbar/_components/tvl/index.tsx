import { useNetworkType } from 'hooks/useNetworkType'
import { useTvl } from 'hooks/useTvl'
import { useTranslations } from 'next-intl'
import React from 'react'
import Skeleton from 'react-loading-skeleton'

import { Amount } from './amount'
import { DollarSign } from './dollarSign'
import { HemiLogo } from './hemiLogo'

export const Tvl = function () {
  const { data, isError, isPending } = useTvl()
  const t = useTranslations('navbar')
  const [networkType] = useNetworkType()
  const isNotTestnet = networkType !== 'testnet'

  const getAmount = function () {
    if (isError) {
      return '-'
    }

    return `$${new Intl.NumberFormat('en', {
      compactDisplay: 'short',
      notation: 'compact',
    }).format(data)}`
  }

  return (
    isNotTestnet && (
      <section
        className="shadow-soft h-22 relative mb-4 w-full overflow-hidden rounded-lg
        md:mb-0 md:mt-4"
        style={{
          background:
            'linear-gradient(0deg, #262626, #262626),linear-gradient(0deg, #FFFFFF, #FFFFFF),linear-gradient(180deg, rgba(0, 0, 0, 0) 10.65%, rgba(0, 0, 0, 0.6) 76.58%)',
        }}
      >
        <HemiLogo className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform" />
        <div className="absolute left-0 top-0 w-full">
          <div className="flex flex-col gap-y-2 p-4">
            <div className="flex w-full items-center justify-between">
              <span className="font-inter-variable text-sm font-medium text-white">
                {t('tvl')}:
              </span>
              <DollarSign />
            </div>
            <div className="-translate-x-1">
              {isPending ? (
                <Skeleton baseColor="#262626" highlightColor="#303030" />
              ) : (
                <>
                  <span className="hidden lg:block">
                    <Amount value={`${getAmount()}`} />
                  </span>
                  <span className="font-inter-display text-2xl font-semibold text-white lg:hidden">
                    {getAmount()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  )
}
