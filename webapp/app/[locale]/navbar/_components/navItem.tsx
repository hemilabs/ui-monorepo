'use client'

import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { ChevronBottomIcon } from 'components/icons/chevronBottomIcon'
import { ChevronUpIcon } from 'components/icons/chevronUpIcon'
import { NavRouterItem } from 'components/navRouterItem'
import { Text } from 'components/text'
import React from 'react'
import { ColorType } from 'types/colortype'

interface NavItemProps {
  IconLeft: React.ElementType
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

export const NavItem = function ({
  IconLeft,
  text,
  isSelected,
  color = 'slate-200',
  subMenus,
  href,
  onClick,
}: NavItemProps) {
  const isExternalLink = url => url && !url.startsWith('/')

  const colorVariants = {
    'slate-200':
      'text-slate-200 group-hover:text-slate-500 transition-colors duration-300',
    'slate-500':
      'text-slate-500 group-hover:text-slate-500 transition-colors duration-300',
  }

  function renderRightIcon() {
    if (subMenus && !isSelected) {
      return <ChevronBottomIcon className={`${colorVariants[color]}`} />
    }
    if (subMenus && isSelected) {
      return <ChevronUpIcon className={`${colorVariants[color]}`} />
    }
    if (isExternalLink(href)) {
      return <ArrowDownLeftIcon className={`${colorVariants[color]}`} />
    }
    return null
  }

  return (
    <>
      <NavRouterItem href={href} isExternal={isExternalLink(href)}>
        <div
          className={`w-45 flex h-10 cursor-pointer items-center justify-between gap-0 rounded-tl-lg 
              bg-transparent px-2.5 py-2 ${
                isSelected
                  ? 'rounded-lg border border-slate-200'
                  : 'hover group'
              }`}
          onClick={onClick}
        >
          <div className="flex items-center">
            <IconLeft
              className={`transition-colors duration-300
              ${
                isSelected && !subMenus
                  ? 'text-orange-1'
                  : `${colorVariants[color]}`
              }`}
            />
            <div className="ml-2 select-none">
              <Text
                className={`${
                  isSelected && !subMenus
                    ? 'text-orange-1'
                    : `${colorVariants[color]}`
                }`}
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
                      className="text-slate-200"
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
