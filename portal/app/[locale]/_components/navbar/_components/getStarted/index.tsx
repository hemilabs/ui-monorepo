import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { Link } from 'components/link'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { ComponentProps, Suspense } from 'react'

import hemiLogo from './_images/hemiLogo.png'
import { Background } from './background'

type Props = Pick<ComponentProps<typeof Link>, 'href' | 'onClick'> & {
  active: boolean
  t: ReturnType<typeof useTranslations<'navbar'>>
}

const UI = ({ active, href, onClick, t }: Props) => (
  <>
    <div className="mx-4 mb-4 md:hidden">
      <ButtonLink
        href={href}
        onClick={onClick}
        size="small"
        variant="secondary"
      >
        <span>{t('get-started')}</span>
        <Chevron.Right className="[&>path]:fill-neutral-500" />
      </ButtonLink>
    </div>
    <Link
      className={`hidden ${active ? '' : 'cursor-pointer'} group/item md:block`}
      href={href}
      onClick={onClick}
    >
      <div className="shadow-soft relative">
        <Background
          className={`rounded-lg border
            ${
              active
                ? 'border-orange-500 [&>g>rect]:fill-orange-50'
                : 'border-neutral-300/55'
            }
            group-hover/item:[&>g>rect]:fill-orange-50`}
        />
        <div className="absolute left-0 top-0 flex h-full w-full flex-col justify-between">
          <div className="m-auto mt-7">
            <Image alt={'hemi-logo'} className="size-13" src={hemiLogo} />
          </div>
          <div className="flex flex-col justify-center px-4 pb-4">
            <div className="flex items-center">
              <span className="text-base text-neutral-950">
                {t('get-started')}
              </span>
              <Chevron.Right className="pl-1 [&>path]:fill-neutral-500" />
            </div>
            <span className="text-sm text-neutral-500">
              {t('learn-how-to-start')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  </>
)

const GetStartedImpl = function (props: Omit<Props, 'onClick'>) {
  const { enabled, track } = useUmami()

  const onClick = enabled ? () => track('nav - get started') : undefined

  return <UI {...props} onClick={onClick} />
}

export const GetStarted = function () {
  const pathname = usePathname()

  const props = {
    active: pathname.endsWith('/get-started/'),
    href: '/get-started',
    t: useTranslations('navbar'),
  }

  // The UI for the get started is the same for mainnet|testnet
  // the only change is how we track on analytics.
  return (
    <Suspense fallback={<UI {...props} />}>
      <GetStartedImpl {...props} />
    </Suspense>
  )
}
