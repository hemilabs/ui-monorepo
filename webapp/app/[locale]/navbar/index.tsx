'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import React, { useState, useEffect } from 'react'
import { Button } from 'ui-common/components/button'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { NavGetStarted } from './_components/navGetStarted'
import { NavItems, type NavItemData } from './_components/navItems'
import { navItems, navItemsBottom } from './navData'

type Props = {
  onItemClick?: (item?: NavItemData) => void
}

export const Navbar = function ({ onItemClick }: Props) {
  const t = useTranslations('common')
  const [selectedItem, setSelectedItem] = useState('')
  const pathname = usePathname()

  useEffect(() => setSelectedItem(''), [pathname])

  function getCurrentPath() {
    const cleanedUrl = pathname.replace(/^\/[a-z]{2}/, '').replace(/\/$/, '')
    const firstPath = `/${cleanedUrl.split('/')[1]}`

    return firstPath
  }

  const handleItemClick = function (item: NavItemData) {
    setSelectedItem(
      (item.subMenus ? item.id : '') !== selectedItem ? item.id : '',
    )
    onItemClick?.(item)
  }

  return (
    <div className="md:h-98vh flex h-[calc(100dvh-64px)] flex-col justify-between pr-5 pt-3 md:pt-0 [&>*]:md:ml-4">
      <div className="mt-8 hidden md:block">
        <div className="ml-2 mt-4 hidden h-10 w-28 md:block">
          <Link href="/tunnel">
            <HemiLogoFull />
          </Link>
        </div>
      </div>
      <div className="mt-2 md:mt-10">
        <NavItems
          color="slate-200"
          isSelectable={true}
          navItems={navItems}
          onItemClick={handleItemClick}
          selectedItem={selectedItem || getCurrentPath()}
        />
      </div>
      <div className="flex-grow" />
      <div>
        <Link href="/get-started" onClick={() => onItemClick()}>
          <NavGetStarted>
            <Button onClick={() => setSelectedItem('')} variant="secondary">
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
          selectedItem={selectedItem || getCurrentPath()}
        />
      </div>
    </div>
  )
}
