'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'
import { Card } from 'ui-common/components/card'
import { Modal } from 'ui-common/components/modal'

import { DeveloperIcon } from './icons/developer'
import { IndividualIcon } from './icons/individual'
import { MinerIcon } from './icons/miner'

export const SelectProfile = function () {
  const t = useTranslations('get-started-page')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const options = [
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
      icon: <IndividualIcon />,
      label: t('options.individual'),
      profile: 'individual',
    },
  ]

  return (
    <Modal>
      <div className="h-3/4 w-full">
        <Card padding="medium" radius="large" shadow="regular">
          <div className="flex flex-col gap-y-7 overflow-y-auto text-center md:max-h-none">
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
                    searchParams.size > 0 ? `?${searchParams.toString()}&` : '?'
                  }profile=${profile}`}
                  key={profile}
                  onClick={() =>
                    localStorage.setItem('portal.get-started-profile', profile)
                  }
                >
                  <div className="w-48 md:w-52">
                    <Card borderColor="gray" padding="medium">
                      <div className="flex flex-col items-center gap-y-5 md:justify-end lg:h-52">
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
    </Modal>
  )
}
