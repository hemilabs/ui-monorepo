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
import { TwitterIcon } from './icons/twitterIcon'

export const FooterSocials = () => (
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
)
