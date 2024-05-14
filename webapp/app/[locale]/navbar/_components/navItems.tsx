'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { ColorType } from 'types/colortype'

import { NavItem } from './navItem'

export type NavItemData = {
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
  selectedItem: string
  onItemClick: (selectedItem: NavItemData) => void
}

export const NavItems = function ({
  color,
  colorSelected = 'orange-1',
  navItems,
  isSelectable,
  selectedItem,
  onItemClick,
}: Props) {
  const t = useTranslations('common') as unknown as (key: string) => string
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>(
    {},
  )

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
        const { id, icon: Icon, href, subMenus } = item
        return (
          <NavItem
            IconLeft={Icon}
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
