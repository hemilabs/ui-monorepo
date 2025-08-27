import { AnalyticsEvent } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { DiscordIcon } from 'components/icons/discordIcon'
import { GithubIcon } from 'components/icons/githubIcon'
import { LinkedinIcon } from 'components/icons/linkedinIcon'
import { TelegramIcon } from 'components/icons/telegramIcon'
import { TiktokIcon } from 'components/icons/tiktokIcon'
import { TwitterIcon } from 'components/icons/twitterIcon'
import { YoutubeIcon } from 'components/icons/youtubeIcon'
import hemiSocials from 'hemi-socials'
import { useUmami } from 'hooks/useUmami'
import { Suspense } from 'react'

const {
  discordUrl,
  githubUrl,
  linkedinUrl,
  telegramNewsUrl,
  tiktokUrl,
  twitterUrl,
  youtubeUrl,
} = hemiSocials

const svgCss =
  '[&_path]:hover:fill-black [&_path]:transition-all [&_path]:duration-300 [&_path]:ease-linear'

const UI = ({
  addTracking,
}: {
  addTracking?: (event: AnalyticsEvent) => () => void | undefined
}) => (
  <div
    className="mb-3 mt-0 flex flex-wrap items-center justify-between gap-x-6 overflow-visible
      px-3 duration-300 md:mb-6 md:mt-6 md:h-10 md:gap-x-2 md:border-t md:border-neutral-300/55 md:!px-0 md:py-2 lg:mb-0"
  >
    <ExternalLink href={twitterUrl} onClick={addTracking?.('nav - x')}>
      <TwitterIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink href={discordUrl} onClick={addTracking?.('nav - discord')}>
      <DiscordIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink
      href={telegramNewsUrl}
      onClick={addTracking?.('nav - telegram news')}
    >
      <TelegramIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink href={linkedinUrl} onClick={addTracking?.('nav - linkedIn')}>
      <LinkedinIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink href={githubUrl} onClick={addTracking?.('nav - gitHub')}>
      <GithubIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink href={youtubeUrl} onClick={addTracking?.('nav - youtube')}>
      <YoutubeIcon className={svgCss} />
    </ExternalLink>
    <ExternalLink href={tiktokUrl} onClick={addTracking?.('nav - tiktok')}>
      <TiktokIcon className={svgCss} />
    </ExternalLink>
  </div>
)

const SocialLinksImpl = function () {
  const { enabled, track } = useUmami()

  const addTracking = (event: AnalyticsEvent) =>
    enabled ? () => track(event) : undefined

  return <UI addTracking={addTracking} />
}

export const SocialLinks = () => (
  <Suspense fallback={<UI />}>
    <SocialLinksImpl />
  </Suspense>
)
