import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { ComponentProps, useEffect, useState } from 'react'

import { Clipboard } from './icons/clipboard'

export const ConfigurationUrl = function ({
  clickableLink = true,
  href,
  ...props
}: ComponentProps<'a'> & { clickableLink?: boolean }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('common')

  useEffect(
    function restoreCopied() {
      if (!copied) {
        return undefined
      }
      const timeoutId = setTimeout(() => setCopied(false), 3000)
      return () => clearTimeout(timeoutId)
    },
    [copied, setCopied],
  )

  const overlay = (
    <div className="text-ms flex items-center gap-x-1 px-2 font-medium leading-5 text-white">
      <span>{t(`${copied ? 'copied' : 'copy'}`)}</span>
      {copied && <CheckMark className="[&>path]:stroke-emerald-500" />}
    </div>
  )

  const onClick = function () {
    setCopied(true)
    window.navigator.clipboard.writeText(href!)
  }

  return (
    <>
      {clickableLink ? (
        <ExternalLink
          className="mr-auto overflow-hidden text-ellipsis whitespace-nowrap text-orange-500 hover:text-orange-700 md:basis-auto"
          href={href}
          {...props}
        >
          {href}
        </ExternalLink>
      ) : (
        <span className="mr-auto text-neutral-950">{href}</span>
      )}
      <Tooltip
        id={`copy-${href}`}
        overlay={overlay}
        trigger={['hover', 'focus']}
      >
        <button
          className="flex cursor-pointer"
          onClick={href ? onClick : undefined}
          type="button"
        >
          <Clipboard />
        </button>
      </Tooltip>
    </>
  )
}
