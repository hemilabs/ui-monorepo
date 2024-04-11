'use client'

import { Text } from 'components/Text'
import React, { useState, ReactElement } from 'react'
import { ColorType } from 'types/colortype'

import { NavRouterItem } from './NavRouterItem'

interface NavItemProps {
  iconLeft: React.ReactNode
  text: React.ReactNode
  iconRightClosed?: React.ReactNode
  iconRightOpened?: React.ReactNode
  isSelected: boolean
  color?: ColorType
  href?: string
  locale: string
  isExternal?: boolean
  subMenus?: {
    id: string
    text: string
    href?: string
    isExternal?: boolean
    onClick?: () => void
  }[]
  onClick?: () => void
}

export function NavItem({
  iconLeft,
  text,
  iconRightClosed,
  iconRightOpened,
  isSelected,
  color = 'gray-3',
  subMenus,
  href,
  locale,
  isExternal,
  onClick,
}: NavItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const getColor = () => (isHovered && !isSelected ? 'gray-9' : color)

  return (
    <>
      <NavRouterItem href={href} isExternal={isExternal} locale={locale}>
        <div
          className={`w-45 flex h-10 cursor-pointer items-center justify-between rounded-tl-lg bg-transparent 
              px-2.5 py-2 ${
                isSelected ? 'rounded-lg border border-gray-300' : ''
              }`}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ gap: '0px' }}
        >
          <div className="flex items-center">
            {React.cloneElement(iconLeft as ReactElement, {
              color: getColor(),
            })}
            <div className="ml-2 select-none">
              <Text
                color={getColor()}
                size="14"
                transitionColorDurationMs="250"
              >
                {text}
              </Text>
            </div>
          </div>
          {iconRightClosed &&
            (!isSelected || !iconRightOpened) &&
            React.cloneElement(iconRightClosed as ReactElement, {
              color: getColor(),
            })}
          {iconRightOpened &&
            isSelected &&
            React.cloneElement(iconRightOpened as ReactElement, {
              color: getColor(),
            })}
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
                  isExternal={submenu.isExternal}
                  key={submenu.id}
                  locale={locale}
                >
                  <div className="cursor-pointer pb-2">
                    <Text
                      color="gray-3"
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
