'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { ColorType } from 'types/colortype'

import { NavItem } from './navItem'

export type NavItemData = {
  href: string
  icon: React.ElementType
  id: string
  subMenus?: { id: string; text: string; href?: string }[]
}
interface NavItemsProps {
  color: ColorType
  colorSelected?: ColorType
  navItems: NavItemData[]
  isSelectable: boolean
  selectedItem: string
  onItemClick: (selectedItem: string) => void
}

export const NavItems = function ({
  color,
  colorSelected = 'orange-1',
  navItems,
  isSelectable,
  selectedItem,
  onItemClick,
}: NavItemsProps) {
  const t = useTranslations('common') as unknown as (key: string) => string

  return (
    <>
      <div className="flex flex-col justify-center gap-3">
        {navItems.map(({ id, icon: Icon, href, subMenus }) => (
          <NavItem
            IconLeft={Icon}
            color={href === selectedItem ? colorSelected : color}
            href={href}
            isSelected={
              href === selectedItem || (subMenus && selectedItem === id)
            }
            key={id}
            onClick={function () {
              if (isSelectable) {
                onItemClick(subMenus ? id : '')
              }
            }}
            subMenus={subMenus}
            text={t(id)}
          />
        ))}
      </div>
    </>
  )
}
