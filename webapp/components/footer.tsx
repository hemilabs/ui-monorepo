'use client'

import { NavRouterItem } from 'app/[locale]/navbar/_components/navRouterItem'
import {
  discordUrl,
  twitterUrl,
  githubUrl,
  linkedinUrl,
} from 'hemi-metadata/socials'
import React from 'react'

import { DiscordIcon } from './icons/discordIcon'
import { GithubIcon } from './icons/githubIcon'
import { LinkedinIcon } from './icons/linkedinIcon'
import { SmallHemiIcon } from './icons/smallHemiIcon'
import { TwitterIcon } from './icons/twitterIcon'
import { Text } from './text'

export const Footer = () => (
  <>
    <div
      className={`bg-hemi-color-footer flex w-full justify-between gap-6 
      rounded-bl-3xl rounded-br-3xl border 
      border-slate-200 border-opacity-50 px-9 py-4`}
    >
      <div className="flex select-none items-center">
        <div className="mr-1">
          <SmallHemiIcon className="text-slate-200" size="22" />
        </div>
        <Text className="text-slate-200" size="18">
          Hemi
        </Text>
      </div>
      <div className="flex items-center">
        <div className="mr-3">
          <NavRouterItem href={twitterUrl} isExternal={true}>
            <TwitterIcon className="text-slate-200" size="22" />
          </NavRouterItem>
        </div>
        <div className="mr-3">
          <NavRouterItem href={discordUrl} isExternal={true}>
            <DiscordIcon className="text-slate-200" size="22" />
          </NavRouterItem>
        </div>
        <div className="mr-3">
          <NavRouterItem href={githubUrl} isExternal={true}>
            <GithubIcon className="text-slate-200" size="22" />
          </NavRouterItem>
        </div>
        <div>
          <NavRouterItem href={linkedinUrl} isExternal={true}>
            <LinkedinIcon className="text-slate-200" size="22" />
          </NavRouterItem>
        </div>
      </div>
    </div>
  </>
)
