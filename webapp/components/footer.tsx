'use client'

import { NavRouterItem } from 'app/[locale]/navbar/_components/NavRouterItem'
import {
  discordUrl,
  twitterUrl,
  githubUrl,
  linkedinUrl,
} from 'hemi-metadata/socials'
import React from 'react'

import { DiscordIcon } from './icons/DiscordIcon'
import { GithubIcon } from './icons/GithubIcon'
import { LinkedinIcon } from './icons/LinkedinIcon'
import { SmallHemiIcon } from './icons/SmallHemiIcon'
import { TwitterIcon } from './icons/TwitterIcon'
import { Text } from './Text'

type FooterProps = {
  locale: string
}

export const Footer = ({ locale }: FooterProps) => (
  <>
    <div
      className={`bg-hemi-color-footer flex w-full justify-between gap-6 rounded-bl-[24px] rounded-br-[24px] border 
      border-gray-300 border-opacity-50 px-9 py-4`}
    >
      <div className="flex select-none items-center">
        <div className="mr-1">
          <SmallHemiIcon color="gray-3" size="22" />
        </div>
        <Text color="gray-3" size="18">
          hemi
        </Text>
      </div>
      <div className="flex items-center">
        <div className="mr-3">
          <NavRouterItem href={twitterUrl} isExternal={true} locale={locale}>
            <TwitterIcon color="gray-3" size="22" />
          </NavRouterItem>
        </div>
        <div className="mr-3">
          <NavRouterItem href={discordUrl} isExternal={true} locale={locale}>
            <DiscordIcon color="gray-3" size="22" />
          </NavRouterItem>
        </div>
        <div className="mr-3">
          <NavRouterItem href={githubUrl} isExternal={true} locale={locale}>
            <GithubIcon color="gray-3" size="22" />
          </NavRouterItem>
        </div>
        {/* <div className="mr-3">
          <TelegramIcon color="gray-3" size="22" />
        </div> */}
        <div>
          <NavRouterItem href={linkedinUrl} isExternal={true} locale={locale}>
            <LinkedinIcon color="gray-3" size="22" />
          </NavRouterItem>
        </div>
      </div>
    </div>
  </>
)
