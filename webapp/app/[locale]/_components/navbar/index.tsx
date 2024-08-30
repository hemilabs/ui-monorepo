'use client'

import { FooterSocials } from 'components/footerSocials'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import React, { Suspense } from 'react'
import { Button } from 'ui-common/components/button'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { NavGetStarted } from './_components/navGetStarted'
import { NavItems, type NavItemData } from './_components/navItems'
import { getNavItems, navItemsBottom } from './navData'

type Props = {
  onItemClick?: (item?: NavItemData) => void
}

const NavbarImplementation = function ({ onItemClick }: Props) {
  const hemi = useHemi()
  const t = useTranslations('common')

  const handleItemClick = function (item: NavItemData) {
    onItemClick?.(item)
  }

  return (
    <div className="md:h-98vh flex h-[calc(100dvh-64px)] flex-col pt-3 md:pt-0 [&>*]:pr-4 [&>*]:md:ml-4">
      <div className="mt-8 hidden md:mb-6 md:block">
        <div className="mt-4 hidden h-10 w-28 md:block">
          <Link href="/tunnel">
            <HemiLogoFull />
          </Link>
        </div>
      </div>
      <div className="flex h-full flex-col overflow-y-auto pt-4">
        <NavItems
          color="slate-200"
          isSelectable={true}
          navItems={getNavItems(hemi)}
          onItemClick={handleItemClick}
        />
        <div className="mt-auto">
          <Link href="/get-started" onClick={() => onItemClick?.()}>
            <NavGetStarted>
              <Button size="medium" variant="secondary">
                {t('get-started')}
              </Button>
            </NavGetStarted>
          </Link>
        </div>
        <div className="mt-6">
          <NavItems
            color="slate-500"
            isSelectable={false}
            navItems={navItemsBottom}
            onItemClick={handleItemClick}
          />
        </div>
        <div className="block pb-6 pl-2 md:hidden">
          <FooterSocials />
        </div>
      </div>
    </div>
  )
}

export const Navbar = ({ onItemClick }: Props) => (
  <Suspense>
    <NavbarImplementation onItemClick={onItemClick} />
  </Suspense>
)
