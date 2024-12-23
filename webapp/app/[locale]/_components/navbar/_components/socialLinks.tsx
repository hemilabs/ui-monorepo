import { AnalyticsEvent } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { DiscordIcon } from 'components/icons/discordIcon'
import { GithubIcon } from 'components/icons/githubIcon'
import { LinkedinIcon } from 'components/icons/linkedinIcon'
import { TwitterIcon } from 'components/icons/twitterIcon'
import { YoutubeIcon } from 'components/icons/youtubeIcon'
import hemiSocials from 'hemi-socials'
import { useUmami } from 'hooks/useUmami'
import React from 'react'

const { discordUrl, linkedinUrl, githubUrl, twitterUrl, youtubeUrl } =
  hemiSocials

const svgCss = 'scale-125 [&_path]:hover:fill-black'

export const SocialLinks = function () {
  const { track } = useUmami()

  const addTracking = (event: AnalyticsEvent) =>
    track ? () => track(event) : undefined

  return (
    <div
      className="mb-1 mt-4 flex flex-wrap items-center justify-center gap-x-6
    rounded-lg bg-transparent md:h-14 md:gap-x-4 md:bg-neutral-50"
    >
      <ExternalLink href={twitterUrl} onClick={addTracking('nav - x')}>
        <TwitterIcon className={svgCss} />
      </ExternalLink>
      <ExternalLink href={discordUrl} onClick={addTracking('nav - discord')}>
        <DiscordIcon className={svgCss} />
      </ExternalLink>
      <ExternalLink href={githubUrl} onClick={addTracking('nav - gitHub')}>
        <GithubIcon className={svgCss} />
      </ExternalLink>
      <ExternalLink href={linkedinUrl} onClick={addTracking('nav - linkedIn')}>
        <LinkedinIcon className={svgCss} />
      </ExternalLink>
      <ExternalLink href={youtubeUrl} onClick={addTracking('nav - youtube')}>
        <YoutubeIcon className={svgCss} />
      </ExternalLink>
    </div>
  )
}
