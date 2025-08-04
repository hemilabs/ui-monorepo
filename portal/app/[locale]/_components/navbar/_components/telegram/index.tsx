import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
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
      <ArrowDownLeftIcon className="opacity-0 transition-opacity group-hover/menu-item:opacity-100" />
    </ExternalLink>
  ),
  id: title.toLowerCase().replace(' ', '-'),
})

const TelegramDesktop = ({
  telegramCommunityUrl,
  telegramNewsUrl,
  trackTelegramClick,
}: {
  telegramCommunityUrl: string
  telegramNewsUrl: string
  trackTelegramClick: (channel: 'community' | 'news') => () => void
}) => (
  <div className="fixed bottom-12 left-20 z-20 hidden w-56 md:block">
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
)

function TelegramDrawer({
  setIsOpen,
  telegramCommunityUrl,
  telegramNewsUrl,
  trackTelegramClick,
}: {
  telegramCommunityUrl: string
  telegramNewsUrl: string
  setIsOpen: (isOpen: boolean) => void
  trackTelegramClick: (channel: 'community' | 'news') => () => void
}) {
  function handleChannelClick(channel: 'community' | 'news') {
    trackTelegramClick(channel)()
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Telegram Channels</h3>
        <div className="space-y-4">
          <ExternalLink
            className="flex items-center justify-between border-b border-gray-100 py-3"
            href={telegramCommunityUrl}
            onClick={() => handleChannelClick('community')}
          >
            <span className="text-base"># Community Channel</span>
            <ArrowDownLeftIcon className="h-5 w-5 text-gray-400" />
          </ExternalLink>
          <ExternalLink
            className="flex items-center justify-between py-3"
            href={telegramNewsUrl}
            onClick={() => handleChannelClick('news')}
          >
            <span className="text-base"># News Channel</span>
            <ArrowDownLeftIcon className="h-5 w-5 text-gray-400" />
          </ExternalLink>
        </div>
      </div>
    </div>
  )
}

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
      className="group/nav relative cursor-pointer rounded-lg py-2 transition-colors duration-300"
      ref={ref}
    >
      <TelegramButton isOpen={isOpen} setIsOpen={setIsOpen} />

      {isOpen && (
        <>
          <TelegramDesktop
            telegramCommunityUrl={telegramCommunityUrl}
            telegramNewsUrl={telegramNewsUrl}
            trackTelegramClick={trackTelegramClick}
          />
          <TelegramDrawer
            setIsOpen={setIsOpen}
            telegramCommunityUrl={telegramCommunityUrl}
            telegramNewsUrl={telegramNewsUrl}
            trackTelegramClick={trackTelegramClick}
          />
        </>
      )}
    </div>
  )
}
