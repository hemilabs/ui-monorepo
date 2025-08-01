import { AnalyticsEvent } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { ArrowRightIcon } from 'components/icons/arrowRightIcon'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { useState } from 'react'

import { TelegramButton } from './telegramButton'

const Backdrop = ({ onClick }: { onClick: () => void }) => (
  <div
    className="absolute bottom-0 left-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    md:hidden"
    onClick={onClick}
  />
)

const TelegramMenuItem = ({
  href,
  onClick,
  title,
}: {
  href: string
  title: string
  onClick?: () => void
}) => (
  <ExternalLink
    className="group/row flex h-14 w-full items-center justify-between rounded-md
    px-4 hover:bg-neutral-50 md:h-8 md:px-3 md:py-2"
    href={href}
    onClick={onClick}
  >
    <span className="text-base font-medium text-neutral-700 group-hover/row:text-neutral-950 md:text-sm">
      # {title}
    </span>
    <ArrowRightIcon className="h-4 w-4 opacity-0 transition-opacity group-hover/row:opacity-100" />
  </ExternalLink>
)

export const Telegram = function ({
  telegramCommunityUrl,
  telegramNewsUrl,
}: {
  telegramCommunityUrl: string
  telegramNewsUrl: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const { track } = useUmami()

  const trackTelegramClick = (channel: string) => () =>
    track?.(`nav - telegram ${channel}` as AnalyticsEvent)
  return (
    <div className="relative cursor-pointer" ref={ref}>
      {isOpen && <Backdrop onClick={() => setIsOpen(!isOpen)} />}
      <TelegramButton isOpen={isOpen} setIsOpen={setIsOpen} />

      {isOpen && (
        <div
          className="shadow-help-menu absolute bottom-full left-1/2 z-50 mb-2
          flex h-fit w-52 -translate-x-1/2
          flex-col items-start rounded-lg
          border border-neutral-300/55 bg-white p-1"
        >
          <TelegramMenuItem
            href={telegramCommunityUrl}
            onClick={trackTelegramClick('community')}
            title="Community Channel"
          />
          <TelegramMenuItem
            href={telegramNewsUrl}
            onClick={trackTelegramClick('news')}
            title="News Channel"
          />
        </div>
      )}
    </div>
  )
}
