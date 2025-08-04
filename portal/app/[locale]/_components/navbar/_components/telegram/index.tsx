import { ExternalLink } from 'components/externalLink'
import { ArrowRightIcon } from 'components/icons/arrowRightIcon'
import { Menu } from 'components/menu'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import { useState } from 'react'

import { TelegramButton } from './telegramButton'

const createTelegramMenuItem = ({
  href,
  onClick,
  title,
}: {
  href: string
  title: string
  onClick?: () => void
}) => ({
  content: (
    <ExternalLink
      className="flex w-full items-center justify-between"
      href={href}
      onClick={onClick}
    >
      <span># {title}</span>
      <ArrowRightIcon className="h-4 w-4 opacity-0 transition-opacity group-hover/menu-item:opacity-100" />
    </ExternalLink>
  ),
  id: title.toLowerCase().replace(' ', '-'),
})

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

  const trackTelegramClick = (channel: 'community' | 'news') => () =>
    track?.(`nav - telegram ${channel}`)

  return (
    <div
      className={`group/nav cursor-pointer rounded-lg py-2 transition-colors duration-300`}
      ref={ref}
    >
      <div>
        <TelegramButton isOpen={isOpen} setIsOpen={setIsOpen} />
        {isOpen && (
          <div className="-translate-y-26 absolute left-1/2 z-20 w-56 -translate-x-1/2 md:left-0 md:translate-x-0">
            <Menu
              items={[
                createTelegramMenuItem({
                  href: telegramCommunityUrl,
                  onClick: trackTelegramClick('community'),
                  title: 'Community Channel',
                }),
                createTelegramMenuItem({
                  href: telegramNewsUrl,
                  onClick: trackTelegramClick('news'),
                  title: 'News Channel',
                }),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
