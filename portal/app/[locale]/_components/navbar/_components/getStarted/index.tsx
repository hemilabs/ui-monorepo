import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { Link } from 'components/link'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import React, { ComponentProps, Suspense } from 'react'

import { HemiLogoIcon } from '../hemiLogo'

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
      className={`hidden ${
        active ? '' : 'cursor-pointer'
      } group/item ml-1 md:block`}
      href={href}
      onClick={onClick}
    >
      <div className="relative h-full w-52 rounded-lg bg-white shadow-sm">
        <Background
          className={`rounded-lg 
            ${
              active
                ? 'outline outline-1 outline-orange-500 [&>rect]:fill-orange-50'
                : '[&>rect]:fill-transparent'
            }
            group-hover/item:[&>rect]:fill-orange-50`}
        />
        <div className="absolute top-4 flex flex-col items-start gap-2.5 px-4">
          <HemiLogoIcon />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-mid font-semibold text-neutral-950">
                {t('get-started')}
              </span>
              <div className="flex size-4 items-center justify-center">
                <Chevron.Right className="[&>path]:fill-neutral-500" />
              </div>
            </div>
            <span className="text-sm font-medium text-neutral-500">
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
