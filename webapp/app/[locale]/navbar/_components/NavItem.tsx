'use client'

import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { ChevronBottomIcon } from 'components/icons/chevronBottomIcon'
import { ChevronUpIcon } from 'components/icons/chevronUpIcon'
import { Text } from 'components/text'
import React, { ReactElement } from 'react'
import { ColorType } from 'types/colortype'

import { NavRouterItem } from './navRouterItem'

interface NavItemProps {
  iconLeft: React.ReactNode
  text: React.ReactNode
  isSelected: boolean
  color?: ColorType
  href?: string
  subMenus?: {
    id: string
    text: string
    href?: string
    onClick?: () => void
  }[]
  onClick?: () => void
}

export function NavItem({
  iconLeft,
  text,
  isSelected,
  color = 'gray-3',
  subMenus,
  href,
  onClick,
}: NavItemProps) {
  const isExternalLink = url => url && !url.startsWith('/')

  function renderRightIcon() {
    if (subMenus && !isSelected) {
      return (
        <ChevronBottomIcon
          className={`group-hover:text-gray-9 text-${color}`}
          transitionColorDurationMs="250"
        />
      )
    }
    if (subMenus && isSelected) {
      return (
        <ChevronUpIcon
          className={`group-hover:text-gray-9 text-${color}`}
          transitionColorDurationMs="250"
        />
      )
    }
    if (isExternalLink(href)) {
      return (
        <ArrowDownLeftIcon
          className={`group-hover:text-gray-9 text-${color}`}
          transitionColorDurationMs="250"
        />
      )
    }
    return null
  }

  return (
    <>
      <NavRouterItem href={href} isExternal={isExternalLink(href)}>
        <div
          className={`w-45 flex h-10 cursor-pointer items-center justify-between gap-0 rounded-tl-lg 
              bg-transparent px-2.5 py-2 ${
                isSelected ? 'rounded-lg border border-gray-300' : 'hover group'
              }`}
          onClick={onClick}
        >
          <div className="flex items-center">
            {React.cloneElement(iconLeft as ReactElement, {
              className: `group-hover:text-gray-9 text-${color}`,
              transitionColorDurationMs: '250',
            })}
            <div className="ml-2 select-none">
              <Text
                className={`${
                  isSelected && !subMenus ? 'text-orange-1' : `text-${color}`
                }
                 group-hover:text-gray-9`}
                size="14"
                transitionColorDurationMs="250"
              >
                {text}
              </Text>
            </div>
          </div>
          {renderRightIcon()}
        </div>
        {subMenus && (
          <div
            className={`accordion-transition ml-5 flex select-none flex-col 
            overflow-hidden duration-500 ease-in-out ${
              isSelected ? 'max-h-[500px]' : 'max-h-0'
            }`}
          >
            {isSelected &&
              subMenus?.map(submenu => (
                <NavRouterItem
                  href={submenu.href}
                  isExternal={isExternalLink(submenu.href)}
                  key={submenu.id}
                >
                  <div className="cursor-pointer pb-2">
                    <Text
                      className="text-gray-3"
                      size="14"
                      transitionColorDurationMs="250"
                    >
                      {submenu.text}
                    </Text>
                  </div>
                </NavRouterItem>
              ))}
          </div>
        )}
      </NavRouterItem>
    </>
  )
}
