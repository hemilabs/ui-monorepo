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
  setSelectedItem: (selectedItem: string) => void
}

export const NavItems = function ({
  color,
  colorSelected = 'orange-1',
  navItems,
  isSelectable,
  selectedItem,
  setSelectedItem,
}: NavItemsProps) {
  const t = useTranslations('common') as unknown as (key: string) => string

  const handleItemClick = itemName => setSelectedItem(itemName)

  return (
    <>
      <div className="flex flex-col justify-center gap-3">
        {navItems.map(({ id, icon: Icon, href, subMenus }) => (
          <NavItem
            color={href === selectedItem ? colorSelected : color}
            href={href}
            iconLeft={
              <Icon
                color={href === selectedItem ? colorSelected : color}
                size="18"
              />
            }
            isSelected={
              href === selectedItem || (subMenus && selectedItem === id)
            }
            key={id}
            onClick={function () {
              if (isSelectable) {
                handleItemClick(subMenus ? id : '')
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