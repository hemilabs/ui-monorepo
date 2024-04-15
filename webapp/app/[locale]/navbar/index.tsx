'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'
import { Button } from 'ui-common/components/button'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { NavGetStarted } from './_components/navGetStarted'
import { NavItems } from './_components/navItems'
import { NavRouterItem } from './_components/navRouterItem'
import { navItems, navItemsBottom } from './navData'

export default function Navbar() {
  const t = useTranslations('common')
  const [selectedItem, setSelectedItem] = useState('')
  const pathname = usePathname()

  useEffect(() => setSelectedItem(''), [pathname])

  function getCurrentPath() {
    const cleanedUrl = pathname.replace(/^\/[a-z]{2}/, '').replace(/\/$/, '')
    return cleanedUrl
  }

  return (
    <div className="h-98vh flex flex-col justify-between">
      <div className="mt-8">
        <div className="ml-10 mt-4 hidden h-10 w-28 md:block">
          <NavRouterItem href="/tunnel">
            <HemiLogoFull />
          </NavRouterItem>
        </div>
      </div>
      <div className="ml-8 mt-10">
        <NavItems
          color="gray-3"
          isSelectable={true}
          navItems={navItems}
          selectedItem={selectedItem || getCurrentPath()}
          setSelectedItem={setSelectedItem}
        />
      </div>
      <div className="flex-grow"></div>
      <div className="ml-8">
        <NavGetStarted>
          <NavRouterItem href={'/get-started'} isExternal={false}>
            <Button onClick={() => setSelectedItem('')} variant="secondary">
              {t('get-started')}
            </Button>
          </NavRouterItem>
        </NavGetStarted>
      </div>
      <div className="ml-8 mt-6">
        <NavItems
          color="gray-9"
          isSelectable={false}
          navItems={navItemsBottom}
          selectedItem={selectedItem || getCurrentPath()}
          setSelectedItem={setSelectedItem}
        />
      </div>
    </div>
  )
}
