'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { ColorType } from 'types/colortype'
import { NavItemId } from 'types/navItemId'

import { NavItem } from './NavItem'

export type NavItemData = {
  color: ColorType
  colorSelected?: ColorType
  href: string
  isExternal?: boolean
  icon: React.ElementType
  id: NavItemId
  iconRightClosed?: React.ElementType
  iconRightOpened?: React.ElementType
  subMenus?: { id: string; text: string; href?: string; isExternal?: boolean }[]
}

interface NavItemsProps {
  navItems: NavItemData[]
  isSelectable: boolean
  locale: string
  selectedItem: string
  setSelectedItem: (selectedItem: string) => void
}

export function NavItems({
  navItems,
  isSelectable,
  locale,
  selectedItem,
  setSelectedItem,
}: NavItemsProps) {
  const t = useTranslations('common')

  const handleItemClick = itemName => setSelectedItem(itemName)

  return (
    <>
      <div className="flex flex-col justify-center gap-3">
        {navItems.map(
          ({
            id,
            icon: Icon,
            color,
            colorSelected = 'orange-1',
            iconRightClosed: IconRightClosed,
            iconRightOpened: IconRightOpened,
            href,
            isExternal,
            subMenus,
          }) => (
            <NavItem
              color={id === selectedItem ? colorSelected : color}
              href={href}
              iconLeft={
                <Icon
                  color={id === selectedItem ? colorSelected : color}
                  size="18"
                />
              }
              iconRightClosed={
                IconRightClosed && (
                  <IconRightClosed
                    color={color}
                    size="18"
                    transitionColorDurationMs="250"
                  />
                )
              }
              iconRightOpened={
                IconRightOpened && (
                  <IconRightOpened
                    color={color}
                    size="18"
                    transitionColorDurationMs="250"
                  />
                )
              }
              isExternal={isExternal}
              isSelected={id === selectedItem}
              key={id}
              locale={locale}
              onClick={function () {
                if (isSelectable && !isExternal) {
                  handleItemClick(id)
                }
              }}
              subMenus={subMenus}
              text={t(id)}
            />
          ),
        )}
      </div>
    </>
  )
}
