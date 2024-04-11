'use client'

import { NavItemData } from 'app/[locale]/navbar/_components/NavItems'
import { NavRouterItem } from 'app/[locale]/navbar/_components/NavRouterItem'
import { useTranslations } from 'next-intl'
import React from 'react'

import { Text } from './Text'

type NavbarMobileProps = {
  locale: string
  navItems: NavItemData[]
  onClick?: () => void
}

export function NavbarMobile({ locale, navItems, onClick }: NavbarMobileProps) {
  const t = useTranslations('common')

  return (
    <>
      {navItems.map(({ id, href, isExternal, subMenus }) =>
        subMenus ? (
          subMenus.map(subMenu => (
            <NavRouterItem
              href={subMenu.href}
              isExternal={subMenu.isExternal}
              key={subMenu.id}
              locale={locale}
            >
              <div className="flex w-full justify-center p-1" onClick={onClick}>
                <Text color="gray-9" size="16">
                  {subMenu.text}
                </Text>
              </div>
            </NavRouterItem>
          ))
        ) : (
          <NavRouterItem
            href={href}
            isExternal={isExternal}
            key={id}
            locale={locale}
          >
            <div className="flex w-full justify-center p-1" onClick={onClick}>
              <Text color="gray-9" size="16">
                {t(id)}
              </Text>
            </div>
          </NavRouterItem>
        ),
      )}
      <NavRouterItem href={'/get-started'} isExternal={false} locale={locale}>
        <div className="flex w-full justify-center p-1" onClick={onClick}>
          <Text color="gray-9" size="16">
            {t('get-started')}
          </Text>
        </div>
      </NavRouterItem>
    </>
  )
}
