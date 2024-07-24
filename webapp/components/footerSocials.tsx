import { ExternalLink } from 'components/externalLink'
import hemiSocials from 'hemi-socials'
import React from 'react'

import { DiscordIcon } from './icons/discordIcon'
import { GithubIcon } from './icons/githubIcon'
import { LinkedinIcon } from './icons/linkedinIcon'
import { TwitterIcon } from './icons/twitterIcon'

const { discordUrl, twitterUrl, githubUrl, linkedinUrl } = hemiSocials

export const FooterSocials = () => (
  <div className="flex items-center">
    <div className="mr-3">
      <ExternalLink href={twitterUrl}>
        <TwitterIcon className="text-slate-200" />
      </ExternalLink>
    </div>
    <div className="mr-3">
      <ExternalLink href={discordUrl}>
        <DiscordIcon className="text-slate-200" />
      </ExternalLink>
    </div>
    <div className="mr-3">
      <ExternalLink href={githubUrl}>
        <GithubIcon className="text-slate-200" />
      </ExternalLink>
    </div>
    <div>
      <ExternalLink href={linkedinUrl}>
        <LinkedinIcon className="text-slate-200" />
      </ExternalLink>
    </div>
  </div>
)
