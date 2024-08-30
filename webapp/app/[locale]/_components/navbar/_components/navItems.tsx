'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { ColorType } from 'types/colortype'

import { NavItem } from './navItem'

export type NavItemData = {
  alertComponent?: React.ElementType
  href: string
  icon: React.ElementType
  id: string
  subMenus?: { id: string; text: string; href?: string }[]
}
type Props = {
  color: ColorType
  colorSelected?: ColorType
  navItems: NavItemData[]
  isSelectable: boolean
  onItemClick: (item: NavItemData) => void
}

export const NavItems = function ({
  color,
  colorSelected = 'orange-1',
  navItems,
  isSelectable,
  onItemClick,
}: Props) {
  const pathname = usePathname()
  const t = useTranslations('common') as unknown as (key: string) => string
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>(
    {},
  )

  const cleanedUrl = pathname.replace(/^\/[a-z]{2}/, '').replace(/\/$/, '')
  const selectedItem = `/${cleanedUrl.split('/')[1]}`

  const handleClick = function (item: NavItemData) {
    onItemClick(item)
    setOpenSubMenus(prevState => ({
      ...prevState,
      [item.id]: !prevState[item.id],
    }))
  }

  return (
    <div className="flex flex-col justify-center">
      {navItems.map(function (item) {
        const { id, icon, href, alertComponent, subMenus } = item
        return (
          <NavItem
            AlertComponent={alertComponent}
            IconLeft={icon}
            color={href === selectedItem ? colorSelected : color}
            href={href}
            isSelected={href === selectedItem}
            key={id}
            onClick={function () {
              if (isSelectable) {
                handleClick(item)
              }
            }}
            subMenuOpened={!!openSubMenus[id]}
            subMenus={subMenus}
            text={t(id)}
          />
        )
      })}
    </div>
  )
}
