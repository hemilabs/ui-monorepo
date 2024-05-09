'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import React, { useState, useEffect } from 'react'
import { Button } from 'ui-common/components/button'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { NavGetStarted } from './_components/navGetStarted'
import { NavItems } from './_components/navItems'
import { navItems, navItemsBottom } from './navData'

export const Navbar = function () {
  const t = useTranslations('common')
  const [selectedItem, setSelectedItem] = useState('')
  const pathname = usePathname()

  useEffect(() => setSelectedItem(''), [pathname])

  function getCurrentPath() {
    const cleanedUrl = pathname.replace(/^\/[a-z]{2}/, '').replace(/\/$/, '')
    const firstPath = `/${cleanedUrl.split('/')[1]}`

    return firstPath
  }

  const handleItemClick = value =>
    setSelectedItem(value === selectedItem ? '' : value)

  return (
    <div className="h-98vh flex flex-col justify-between pr-5">
      <div className="mt-8">
        <div className="ml-10 mt-4 hidden h-10 w-28 md:block">
          <Link href="/tunnel">
            <HemiLogoFull />
          </Link>
        </div>
      </div>
      <div className="ml-8 mt-10">
        <NavItems
          color="slate-200"
          isSelectable={true}
          navItems={navItems}
          onItemClick={handleItemClick}
          selectedItem={selectedItem || getCurrentPath()}
        />
      </div>
      <div className="flex-grow" />
      <div className="ml-8">
        <Link href="/get-started">
          <NavGetStarted>
            <Button onClick={() => setSelectedItem('')} variant="secondary">
              {t('get-started')}
            </Button>
          </NavGetStarted>
        </Link>
      </div>
      <div className="ml-8 mt-6">
        <NavItems
          color="slate-500"
          isSelectable={false}
          navItems={navItemsBottom}
          onItemClick={handleItemClick}
          selectedItem={selectedItem || getCurrentPath()}
        />
      </div>
    </div>
  )
}
