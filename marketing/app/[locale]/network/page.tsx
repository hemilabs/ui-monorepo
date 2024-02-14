'use client'

import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { Card } from 'ui-common/components/card'

import { ConfigureNetwork } from './configureNetworks'
import { QuickStart } from './quickStart'
import { WelcomePack } from './welcomePack'

const NetworkPage = function () {
  const t = useTranslations()

  return (
    <>
      <h1 className="text-4xl font-medium">{t('network.page-title')}</h1>
      <p className="my-3 text-sm text-neutral-400">
        {t('network.page-subtitle')}
      </p>
      <main className="flex flex-col gap-y-4 md:w-full md:flex-row md:justify-between md:gap-x-4">
        <div className="md:basis-2/3">
          <Card>
            <Suspense>
              <ConfigureNetwork />
            </Suspense>
          </Card>
        </div>
        <div>
          <Card>
            <WelcomePack />
          </Card>
        </div>
      </main>
      <QuickStart />
    </>
  )
}

export default NetworkPage
