'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Suspense, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Card } from 'ui-common/components/card'

import { ConfigureNetwork } from './_components/configureNetworks'
import { QuickStart, profiles, Profile } from './_components/quickStart'
import { WelcomePack } from './_components/welcomePack'

const SelectProfile = dynamic(
  () => import('./_components/selectProfile').then(mod => mod.SelectProfile),
  {
    ssr: false,
  },
)

const isProfileValid = (profile: string): profile is Profile =>
  profiles.includes(profile as Profile)

const QuickStartSection = function () {
  const [profile, setProfile] = useQueryState(
    'profile',
    parseAsStringLiteral(profiles),
  )
  const isValid = isProfileValid(profile)
  const [savedProfileChecked, setSavedProfileChecked] = useState(false)

  useEffect(
    function checkPreviouslySetProfileInLocalStorage() {
      if (savedProfileChecked || isValid) {
        return
      }
      const savedProfile = localStorage.getItem('portal.get-started-profile')
      if (isProfileValid(savedProfile)) {
        setProfile(savedProfile)
      } else {
        setSavedProfileChecked(true)
      }
      return
    },
    [isValid, savedProfileChecked, setProfile, setSavedProfileChecked],
  )

  return (
    <>
      <QuickStart profile={isValid ? profile : undefined} />
      {savedProfileChecked && !isValid && <SelectProfile />}
    </>
  )
}

const NetworkPage = function () {
  const t = useTranslations('get-started')

  return (
    <>
      <h1 className="text-3xl font-semibold">{t('network.page-title')}</h1>
      <p className="my-3 text-base text-slate-500">
        {t('network.page-subtitle')}
      </p>
      <main className="flex flex-col gap-y-4 md:w-full md:flex-row md:justify-between md:gap-x-4">
        <div className="md:basis-2/3">
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <Card borderColor="gray" padding="medium" radius="large">
              <ConfigureNetwork />
            </Card>
          </Suspense>
        </div>
        <div className="md:basis-1/3">
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <Card borderColor="gray" padding="medium" radius="large">
              <WelcomePack />
            </Card>
          </Suspense>
        </div>
      </main>
      <Suspense>
        <QuickStartSection />
      </Suspense>
    </>
  )
}

export default NetworkPage
