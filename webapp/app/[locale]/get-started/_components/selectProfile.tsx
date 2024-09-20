'use client'

import { Modal } from 'components/modal'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'
import { Card } from 'ui-common/components/card'

import { DeveloperIcon } from './icons/developer'
import { ExplorersIcon } from './icons/explorers'
import { MinerIcon } from './icons/miner'
import { Profile } from './quickStart'

type Option = {
  icon: React.ReactNode
  label: string
  profile: Profile
}

export const SelectProfile = function () {
  const t = useTranslations('get-started-page')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const options: Option[] = [
    {
      icon: <DeveloperIcon />,
      label: t('options.developer'),
      profile: 'dev',
    },
    {
      icon: <MinerIcon />,
      label: t('options.miner'),
      profile: 'miner',
    },
    {
      icon: <ExplorersIcon />,
      label: t('options.explorer'),
      profile: 'explorers',
    },
  ]

  return (
    <Modal>
      <div className="flex h-screen items-center justify-center md:h-auto md:min-h-0">
        <div className="w-full">
          <Card padding="medium" radius="large" shadow="regular">
            <div className="flex flex-col gap-y-4 overflow-y-auto text-center md:max-h-none md:gap-y-7">
              <h3 className="text-2xl font-medium tracking-tighter text-slate-900 lg:text-3xl">
                {t('heading')}
              </h3>
              <p className="text-base text-slate-500 lg:text-lg">
                {t('sub-heading')}
              </p>
              <div className="flex flex-col items-center gap-y-6 md:flex-row md:gap-x-6">
                {options.map(({ icon, label, profile }) => (
                  <Link
                    href={`${pathname}${
                      searchParams.size > 0
                        ? `?${searchParams.toString()}&`
                        : '?'
                    }profile=${profile}`}
                    key={profile}
                    onClick={() =>
                      localStorage.setItem(
                        'portal.get-started-profile',
                        profile,
                      )
                    }
                  >
                    <div className="w-48 md:w-52">
                      <Card borderColor="gray" padding="medium">
                        <div className="flex flex-col items-center gap-y-2 md:justify-end md:gap-y-5 lg:h-52">
                          <div className="md:mb-7 md:mt-auto">{icon}</div>
                          <Button variant="tertiary">{label}</Button>
                        </div>
                      </Card>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  )
}
