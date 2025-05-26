import { useTvl } from 'hooks/useTvl'
import { useTranslations } from 'next-intl'
import React from 'react'
import Skeleton from 'react-loading-skeleton'

import { Amount } from './amount'
import { Background } from './background'
import { DollarSign } from './dollarSign'

export const Tvl = function () {
  const { data, isPending } = useTvl()
  const t = useTranslations('navbar')

  return (
    <section className="shadow-soft h-22 relative mt-4 w-52">
      <Background />
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
              <Amount value={`$${data}`} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
