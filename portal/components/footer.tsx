'use client'

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
      rounded-bl-3xl rounded-br-3xl border-y 
      border-slate-200 border-opacity-50 px-9 py-4`}
    >
      <div className="flex select-none items-center">
        <div className="mr-1">
          <SmallHemiIcon className="text-slate-200" />
        </div>
        <Text className="text-slate-200" size="18">
          hemi
        </Text>
      </div>
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
  </>
)
