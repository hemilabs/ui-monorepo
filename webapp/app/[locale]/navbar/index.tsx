'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { Button } from 'ui-common/components/button'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { NavGetStarted } from './_components/NavGetStarted'
import { NavItems } from './_components/NavItems'
import { NavRouterItem } from './_components/NavRouterItem'
import { navItems, navItemsBottom } from './navData'

type NavbarProps = {
  locale: string
}

export default function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('common')
  const [selectedItem, setSelectedItem] = useState('tunnel')

  return (
    <div className="flex h-[98vh] flex-col justify-between">
      <div className="mt-8">
        <div className="ml-10 mt-4 hidden h-10 w-28 md:block">
          <HemiLogoFull />
        </div>
      </div>
      <div className="ml-8 mt-10">
        <NavItems
          isSelectable={true}
          locale={locale}
          navItems={navItems}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      </div>
      <div className="flex-grow"></div>
      <div className="ml-8">
        <NavGetStarted>
          <NavRouterItem
            href={'/get-started'}
            isExternal={false}
            locale={locale}
          >
            <Button onClick={() => setSelectedItem('')} variant="secondary">
              {t('get-started')}
            </Button>
          </NavRouterItem>
        </NavGetStarted>
      </div>
      <div className="ml-8 mt-6">
        <NavItems
          isSelectable={false}
          locale={locale}
          navItems={navItemsBottom}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      </div>
    </div>
  )
}
