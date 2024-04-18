'use client'

import { NavItemData } from 'app/[locale]/navbar/_components/navItems'
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
import { NavRouterItem } from './navRouterItem'
import { Text } from './text'

type NavbarMobileProps = {
  navItems: NavItemData[]
  onClick?: () => void
}

export const NavbarMobile = function ({
  navItems,
  onClick,
}: NavbarMobileProps) {
  const t = useTranslations('common') as unknown as (key: string) => string
  const isExternalLink = url => url && !url.startsWith('/')

  return (
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
                  <Text className="text-slate-200" size="16">
                    {subMenu.text}
                  </Text>
                  <ArrowDownLeftIcon className="ml-2 text-slate-200" />
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
                <Icon className="mr-1 text-slate-200" />
                <Text className="text-slate-200" size="16">
                  {t(id)}
                </Text>
                {isExternalLink(href) && (
                  <ArrowDownLeftIcon className="ml-2 text-slate-200" />
                )}
              </div>
            </NavRouterItem>
          ),
        )}
        <NavRouterItem href="/get-started" isExternal={false}>
          <div
            className="ml-2 flex w-full justify-center rounded-lg border border-slate-200 p-1"
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
            <a href={twitterUrl} rel="noopener noreferrer" target="_blank">
              <TwitterIcon className="text-slate-200" />
            </a>
          </div>
          <div className="mr-3">
            <a href={discordUrl} rel="noopener noreferrer" target="_blank">
              <DiscordIcon className="text-slate-200" />
            </a>
          </div>
          <div className="mr-3">
            <a href={githubUrl} rel="noopener noreferrer" target="_blank">
              <GithubIcon className="text-slate-200" />
            </a>
          </div>
          <div>
            <a href={linkedinUrl} rel="noopener noreferrer" target="_blank">
              <LinkedinIcon className="text-slate-200" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
