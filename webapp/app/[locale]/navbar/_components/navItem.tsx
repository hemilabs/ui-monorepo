'use client'

import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { ChevronBottomIcon } from 'components/icons/chevronBottomIcon'
import { ChevronUpIcon } from 'components/icons/chevronUpIcon'
import { NavRouterItem } from 'components/navRouterItem'
import { Text } from 'components/text'
import React from 'react'
import { ColorType } from 'types/colortype'

interface SubMenu {
  id: string
  text: string
  href?: string
  onClick?: () => void
}

interface NavItemProps {
  AlertComponent?: React.ElementType
  IconLeft: React.ElementType
  text: React.ReactNode
  isSelected: boolean
  color?: ColorType
  href?: string
  subMenus?: SubMenu[]
  subMenuOpened?: boolean
  onClick?: () => void
}

export const NavItem = function ({
  AlertComponent,
  IconLeft,
  text,
  isSelected,
  color = 'slate-200',
  subMenus,
  href,
  onClick,
  subMenuOpened,
}: NavItemProps) {
  const isExternalLink = url => url && !url.startsWith('/')

  const colorVariants = {
    'slate-200':
      'text-slate-200 group-hover:text-slate-500 transition-colors duration-300',
    'slate-500':
      'text-slate-500 group-hover:text-slate-500 transition-colors duration-300',
  }

  const getTextColor = function () {
    if (isSelected && !subMenus) {
      return 'text-orange-1'
    }
    if (subMenus && subMenuOpened) {
      return 'text-slate-950'
    }
    return colorVariants[color]
  }

  function renderRightIcon() {
    if (subMenus && !subMenuOpened) {
      return <ChevronBottomIcon className={getTextColor()} />
    }
    if (subMenus && subMenuOpened) {
      return <ChevronUpIcon className={getTextColor()} />
    }
    if (isExternalLink(href)) {
      return <ArrowDownLeftIcon className={getTextColor()} />
    }
    return null
  }

  return (
    <NavRouterItem href={href} isExternal={isExternalLink(href)}>
      <div
        className={`w-45 relative mb-3 flex h-10 cursor-pointer items-center justify-between 
            rounded-tl-lg bg-transparent px-2.5 py-2 ${
              isSelected ? 'rounded-lg border border-slate-200' : 'hover group'
            }`}
        onClick={onClick}
      >
        <div className="flex items-center">
          <IconLeft
            className={`mt-1 transition-colors duration-300
            ${getTextColor()}`}
          />
          <div className="ml-2 select-none">
            <Text
              className={getTextColor()}
              size="14"
              transitionColorDurationMs="250"
            >
              {text}
            </Text>
          </div>
        </div>
        <div className="mt-1">{renderRightIcon()}</div>
        {AlertComponent && <AlertComponent />}
      </div>
      {subMenus && (
        <div
          className={`accordion-transition ml-5 flex select-none flex-col 
          overflow-hidden duration-500 ease-in-out ${
            subMenuOpened ? 'max-h-[500px]' : 'max-h-0'
          }`}
        >
          {subMenuOpened &&
            subMenus?.map(submenu => (
              <NavRouterItem
                href={submenu.href}
                isExternal={isExternalLink(submenu.href)}
                key={submenu.id}
              >
                <div className="hover group ml-6 mr-2 flex cursor-pointer justify-between pb-2">
                  <Text
                    className="text-slate-200 group-hover:text-slate-500"
                    size="14"
                    transitionColorDurationMs="250"
                  >
                    {submenu.text}
                  </Text>
                  {isExternalLink(submenu.href) && (
                    <ArrowDownLeftIcon className={colorVariants[color]} />
                  )}
                </div>
              </NavRouterItem>
            ))}
        </div>
      )}
    </NavRouterItem>
  )
}
