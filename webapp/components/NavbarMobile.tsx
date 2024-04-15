'use client'

import { NavItemData } from 'app/[locale]/navbar/_components/navItems'
import { NavRouterItem } from 'app/[locale]/navbar/_components/navRouterItem'
import {
  discordUrl,
  githubUrl,
  linkedinUrl,
  twitterUrl,
} from 'hemi-metadata/socials'
import { useTranslations } from 'next-intl'
import React from 'react'

import { ArrowDownLeftIcon } from './icons/arrowDownLeftIcon'
import { DiscordIcon } from './icons/discordIcon'
import { GithubIcon } from './icons/githubIcon'
import { LinkedinIcon } from './icons/linkedinIcon'
import { TwitterIcon } from './icons/twitterIcon'
import { Text } from './text'

type NavbarMobileProps = {
  navItems: NavItemData[]
  onClick?: () => void
}

export function NavbarMobile({ navItems, onClick }: NavbarMobileProps) {
  const t = useTranslations('common') as unknown as (key: string) => string
  const isExternalLink = url => url && !url.startsWith('/')

  return (
    <>
      <div className="flex items-end">
        <div className="flex flex-col items-start">
          {navItems.map(({ id, href, subMenus, icon: Icon }) =>
            subMenus ? (
              subMenus.map(subMenu => (
                <NavRouterItem
                  href={subMenu.href}
                  isExternal={isExternalLink(subMenu.href)}
                  key={subMenu.id}
                >
                  <div
                    className="ml-2 flex w-full items-center p-1"
                    onClick={onClick}
                  >
                    <Text className="text-gray-3" size="16">
                      {subMenu.text}
                    </Text>
                    <ArrowDownLeftIcon className="text-gray-3 ml-2" size="18" />
                  </div>
                </NavRouterItem>
              ))
            ) : (
              <NavRouterItem
                href={href}
                isExternal={isExternalLink(href)}
                key={id}
              >
                <div
                  className="ml-2 flex w-full items-center p-1"
                  onClick={onClick}
                >
                  <Icon className="text-gray-3 mr-1" size="18" />
                  <Text className="text-gray-3" size="16">
                    {t(id)}
                  </Text>
                  {isExternalLink(href) && (
                    <ArrowDownLeftIcon className="text-gray-3 ml-2" size="18" />
                  )}
                </div>
              </NavRouterItem>
            ),
          )}
          <NavRouterItem href="/get-started" isExternal={false}>
            <div
              className="ml-2 flex w-full justify-center rounded-lg border border-gray-300 p-1"
              onClick={onClick}
            >
              <Text className="text-orange-1 mr-1" size="16">
                {t('get-started')}
              </Text>
            </div>
          </NavRouterItem>
        </div>
        <div className="ml-8 flex justify-end p-1" onClick={onClick}>
          <div className="flex items-center">
            <div className="mr-3">
              <NavRouterItem href={twitterUrl} isExternal={true}>
                <TwitterIcon className="text-gray-3" size="22" />
              </NavRouterItem>
            </div>
            <div className="mr-3">
              <NavRouterItem href={discordUrl} isExternal={true}>
                <DiscordIcon className="text-gray-3" size="22" />
              </NavRouterItem>
            </div>
            <div className="mr-3">
              <NavRouterItem href={githubUrl} isExternal={true}>
                <GithubIcon className="text-gray-3" size="22" />
              </NavRouterItem>
            </div>
            <div>
              <NavRouterItem href={linkedinUrl} isExternal={true}>
                <LinkedinIcon className="text-gray-3" size="22" />
              </NavRouterItem>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
