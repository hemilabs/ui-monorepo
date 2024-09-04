import { ExternalLink } from 'components/externalLink'
import { DiscordIcon } from 'components/icons/discordIcon'
import { GithubIcon } from 'components/icons/githubIcon'
import { LinkedinIcon } from 'components/icons/linkedinIcon'
import { TwitterIcon } from 'components/icons/twitterIcon'
import hemiSocials from 'hemi-socials'
import React from 'react'

const { discordUrl, twitterUrl, githubUrl, linkedinUrl } = hemiSocials

export const SocialLinks = () => (
  <div className="mb-1 mt-4 flex items-center justify-center gap-x-6 rounded-lg bg-transparent md:h-14 md:gap-x-4 md:bg-neutral-50">
    <ExternalLink href={twitterUrl}>
      <TwitterIcon className="scale-125" />
    </ExternalLink>
    <ExternalLink href={discordUrl}>
      <DiscordIcon className="scale-125" />
    </ExternalLink>
    <ExternalLink href={githubUrl}>
      <GithubIcon className="scale-125" />
    </ExternalLink>
    <ExternalLink href={linkedinUrl}>
      <LinkedinIcon className="scale-125" />
    </ExternalLink>
  </div>
)
